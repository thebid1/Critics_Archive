import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/server";
import { fromPaystackMinorUnits, isValidPaystackSignature } from "@/lib/paystack";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature") ?? "";
  if (!isValidPaystackSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }
  try {
    const event = JSON.parse(rawBody) as { event?: string; data?: { status?: string; reference?: string; amount?: number; currency?: string } };
    if (event.event !== "charge.success") return NextResponse.json({ received: true });
    const payment = event.data;
    if (!payment?.reference || payment.status !== "success" || typeof payment.amount !== "number" || !payment.currency) {
      return NextResponse.json({ error: "Invalid payment event." }, { status: 400 });
    }
    const { error } = await createAdminSupabase().rpc("fulfill_paid_order", { order_reference: payment.reference, paid_amount: fromPaystackMinorUnits(payment.amount, payment.currency), paid_currency: payment.currency });
    if (error) throw error;
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Paystack webhook failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}