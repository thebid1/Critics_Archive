import { NextResponse } from "next/server";
import { requireAdminRequest } from "@/lib/admin/guard";
import { asOptionalString, asUuid, isRecord, readJsonBody } from "@/lib/admin/request";
import { createAdminSupabase } from "@/lib/supabase/server";
import { sendShippedForOrderId } from "@/lib/order-shipped";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Re-send the shipped email (e.g. when a tracking number changes). Audited.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminRequest();
  if (!auth.ok) return auth.response;

  const id = asUuid((await params).id);
  if (!id) return NextResponse.json({ error: "Invalid order id." }, { status: 400 });

  const { body, error, status } = await readJsonBody(request, 2_048);
  if (error) return NextResponse.json({ error }, { status: status ?? 400 });
  const tracking = isRecord(body) ? asOptionalString(body.tracking_number, 200) : "";

  const supabase = createAdminSupabase();
  const { data: order } = await supabase
    .from("orders")
    .select("id, reference, status")
    .eq("id", id)
    .maybeSingle();
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  if (order.status !== "fulfilled") {
    return NextResponse.json(
      { error: "Only fulfilled orders can resend a shipped email." },
      { status: 409 }
    );
  }

  // Clear the idempotency marker, then send with the current tracking number.
  await supabase
    .from("orders")
    .update({ shipped_email_sent_at: null })
    .eq("id", id);

  const sendError = await sendShippedForOrderId(id, tracking);
  if (sendError) {
    return NextResponse.json({ error: "Could not send the shipped email." }, { status: 500 });
  }

  await supabase.rpc("record_admin_action", {
    p_admin_email: auth.email,
    p_action: "shipped_email_resent",
    p_target_table: "orders",
    p_target_id: id,
    p_before: null,
    p_after: { reference: order.reference, tracking_number: tracking },
  });

  return NextResponse.json({ ok: true });
}