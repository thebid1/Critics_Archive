import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/server";
import { fromPaystackMinorUnits, isValidPaystackSignature } from "@/lib/paystack";
import { sendOrderNotificationsForReference } from "@/lib/order-confirmation";

export const dynamic = "force-dynamic";











export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 1_048_576) {
    return NextResponse.json({ error: "Request is too large." }, { status: 413 });
  }
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature") ?? "";
  if (!isValidPaystackSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  let event: { event?: string; data?: { status?: string; reference?: string; amount?: number; currency?: string } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    // Signed but unparseable — acknowledge without retry.
    return NextResponse.json({ received: true });
  }

  if (event.event !== "charge.success") {
    return NextResponse.json({ received: true });
  }

  const payment = event.data;
  if (!payment?.reference || payment.status !== "success" || typeof payment.amount !== "number" || !payment.currency) {
    // Paystack delivered a malformed success event; acknowledge so it stops retrying.
    console.error("Paystack webhook: malformed charge.success payload", { payment });
    return NextResponse.json({ received: true });
  }

  try {
    const { error } = await createAdminSupabase().rpc("fulfill_paid_order", {
      order_reference: payment.reference,
      paid_amount: fromPaystackMinorUnits(payment.amount, payment.currency),
      paid_currency: payment.currency,
    });
    if (error) {
      // Log and acknowledge: a fulfillment failure (e.g. amount mismatch) won't be
      // fixed by Paystack retrying forever. The verify/callback path will surface it
      // to the customer; support can reconcile via the order reference.
      console.error("Paystack webhook: fulfillment skipped", { reference: payment.reference, error: error.message });
    } else {
      // Send the confirmation email EXACTLY ONCE. Fulfillment is idempotent, so a
      // duplicate delivery re-runs it harmlessly; the claim gates only the email.
      // A duplicate webhook (or a racing verify call) sees claimed=false and skips
      // the send — closing the confirmation-email race in security.md.
      const { data: claimed, error: claimError } = await createAdminSupabase().rpc(
        "claim_paystack_event",
        { p_reference: payment.reference, p_event: "charge.success" }
      );
      if (claimError) throw claimError;
      if (claimed === true) {
        try {
          await sendOrderNotificationsForReference(payment.reference);
        } catch (emailError: unknown) {
          console.error("Order emails: unexpected failure", emailError instanceof Error ? emailError.message : "Unknown error");
        }
      }
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Paystack webhook: unexpected error", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ received: true });
  }
}