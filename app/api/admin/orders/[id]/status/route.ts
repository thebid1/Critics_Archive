import { NextResponse } from "next/server";
import { requireAdminRequest } from "@/lib/admin/guard";
import { asOptionalString, asUuid, isRecord, readJsonBody } from "@/lib/admin/request";
import { createAdminSupabase } from "@/lib/supabase/server";
import { sendShippedForOrderId } from "@/lib/order-shipped";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const ALLOWED_TRANSITIONS = new Set(["fulfilled", "cancelled"]);

/**
 * Order status update (admin).
 *   - fulfilled: paid (or already fulfilled) orders; optional tracking number →
 *     sends the shipped-notification email (best-effort, never blocks).
 *   - cancelled: pending orders only; RPC re-credits reserved stock.
 * 'paid' state is OFF-LIMITS to the admin — only a verified Paystack webhook /
 * server-side verification may set it (agents.md payment rule).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminRequest();
  if (!auth.ok) return auth.response;

  const id = asUuid((await params).id);
  if (!id) return NextResponse.json({ error: "Invalid order id." }, { status: 400 });

  if (request.headers.get("content-type")?.split(";", 1)[0] !== "application/json") {
    return NextResponse.json({ error: "JSON is required." }, { status: 415 });
  }

  const { body, error, status } = await readJsonBody(request, 2_048);
  if (error) return NextResponse.json({ error }, { status: status ?? 400 });
  if (!isRecord(body) || typeof body.status !== "string") {
    return NextResponse.json({ error: "A status is required." }, { status: 400 });
  }
  if (!ALLOWED_TRANSITIONS.has(body.status)) {
    return NextResponse.json(
      { error: "Allowed status changes: fulfilled or cancelled. Paid can only be set by Paystack." },
      { status: 400 }
    );
  }

  const tracking =
    body.status === "fulfilled" ? asOptionalString(body.tracking_number, 200) : "";

  try {
    const supabase = createAdminSupabase();
    const { data, error: rpcError } = await supabase.rpc("update_order_status", {
      p_order_id: id,
      p_admin_email: auth.email,
      p_status: body.status,
      p_tracking: tracking,
    });

    if (rpcError) {
      const message = (rpcError.message ?? "").toLowerCase();
      if (message.includes("not_found")) {
        return NextResponse.json({ error: "Order not found." }, { status: 404 });
      }
      if (message.includes("paid")) {
        return NextResponse.json({ error: "Only a verified payment can set an order to paid." }, { status: 409 });
      }
      if (message.includes("only_pending")) {
        return NextResponse.json({ error: "Only pending orders can be cancelled." }, { status: 409 });
      }
      if (message.includes("only_paid")) {
        return NextResponse.json({ error: "Only paid orders can be marked fulfilled." }, { status: 409 });
      }
      throw rpcError;
    }

    // Trigger the shipped email only after the status change is committed.
    if (body.status === "fulfilled") {
      const sendError = await sendShippedForOrderId(id, tracking);
      if (sendError) {
        console.error("Shipped email failed to send", { orderId: id, error: sendError });
      }
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Admin order status update failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Could not update the order." }, { status: 500 });
  }
}