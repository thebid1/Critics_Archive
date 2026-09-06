import { NextResponse } from "next/server";
import { requireAdminRequest } from "@/lib/admin/guard";
import { asUuid } from "@/lib/admin/request";
import { createAdminSupabase } from "@/lib/supabase/server";
import { sendOrderConfirmationForReference } from "@/lib/order-confirmation";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Re-send the Stage 6 order-confirmation email (reuses its exact send function —
 * no duplicated email logic). Audited via record_admin_action.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminRequest();
  if (!auth.ok) return auth.response;

  const id = asUuid((await params).id);
  if (!id) return NextResponse.json({ error: "Invalid order id." }, { status: 400 });

  const supabase = createAdminSupabase();
  const { data: order } = await supabase
    .from("orders")
    .select("id, reference")
    .eq("id", id)
    .maybeSingle();
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  // The shared Stage 6 function is idempotent via confirmation_email_sent_at —
  // but for a manual resend we want it to go out even if already sent, so the
  // marker is nulled first (inside its own update), then we call the sender.
  await supabase
    .from("orders")
    .update({ confirmation_email_sent_at: null })
    .eq("id", id);

  await sendOrderConfirmationForReference(order.reference);

  await supabase.rpc("record_admin_action", {
    p_admin_email: auth.email,
    p_action: "confirmation_email_resent",
    p_target_table: "orders",
    p_target_id: id,
    p_before: null,
    p_after: { reference: order.reference },
  });

  return NextResponse.json({ ok: true });
}