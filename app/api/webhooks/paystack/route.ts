import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/server";
import { isValidPaystackSignature, paidAmountInMajorUnits } from "@/lib/paystack";
import { sendOrderNotificationsForReference } from "@/lib/order-confirmation";

export const dynamic = "force-dynamic";











export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 1_048_576) {
    return NextResponse.json({ error: "Request is too large." }, { status: 413 });
  }
  // Read the raw bytes so the HMAC is computed over exactly what Paystack sent
  // (decoding to a string could otherwise alter byte sequences before hashing).
  const rawBody = Buffer.from(await request.arrayBuffer());
  const signature = request.headers.get("x-paystack-signature") ?? "";
  if (!isValidPaystackSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  let event: {
    event?: string;
    data?: {
      status?: string;
      reference?: string;
      amount?: number;
      requested_amount?: number | null;
      currency?: string;
    };
  };
  try {
    event = JSON.parse(rawBody.toString("utf8"));
  } catch {
    // Signed but unparseable — acknowledge without retry.
    return NextResponse.json({ received: true });
  }

  if (event.event !== "charge.success") {
    return NextResponse.json({ received: true });
  }

  const payment = event.data;
  const verifiedAmount = payment?.requested_amount ?? payment?.amount;
  if (!payment?.reference || payment.status !== "success" || typeof verifiedAmount !== "number" || !payment.currency) {
    // Paystack delivered a malformed success event; acknowledge so it stops retrying.
    console.error("Paystack webhook: malformed charge.success payload", { payment });
    return NextResponse.json({ received: true });
  }

  try {
    const { data, error } = await createAdminSupabase().rpc("fulfill_paid_order", {
      order_reference: payment.reference,
      paid_amount: paidAmountInMajorUnits(payment),
      paid_currency: payment.currency,
    });
    if (error) {
      console.error("Paystack webhook: fulfillment skipped", { reference: payment.reference, error: error.message });
    } else if (data === "paid" || data === "already_paid") {
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