import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/server";
import { fromPaystackMinorUnits, verifyPaystackTransaction } from "@/lib/paystack";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { sendOrderNotificationsForReference } from "@/lib/order-confirmation";
import { verifySchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // Rate limit verification probes.
  const ip = getClientIp(request);
  const limiter = rateLimit({ ip, limit: 20, windowMs: 60_000 });
  if (!limiter.ok) {
    return NextResponse.json(
      { error: "Too many verification attempts. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((limiter.resetAt - Date.now()) / 1000)) } }
    );
  }

  if (request.headers.get("content-type")?.split(";", 1)[0] !== "application/json") {
    return NextResponse.json({ error: "JSON is required." }, { status: 415 });
  }

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return NextResponse.json({ error: "Unable to read request body." }, { status: 400 });
  }
  if (raw.length > 2_048) {
    return NextResponse.json({ error: "Request is too large." }, { status: 413 });
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(raw) as unknown;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = verifySchema.safeParse(parsedJson);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payment reference." }, { status: 400 });
  }
  const reference = parsed.data.reference;

  try {
    const payment = await verifyPaystackTransaction(reference);
    if (!payment.status || payment.data.status !== "success") {
      const responseStatus = ["pending", "ongoing", "processing"].includes(payment.data.status) ? 202 : 402;
      return NextResponse.json(
        {
          status: payment.data.status,
          message:
            payment.data.message ??
            payment.data.gateway_response ??
            "Payment has not succeeded.",
        },
        { status: responseStatus }
      );
    }
    const { data, error } = await createAdminSupabase().rpc("fulfill_paid_order", {
      order_reference: reference,
      paid_amount: fromPaystackMinorUnits(payment.data.amount, payment.data.currency),
      paid_currency: payment.data.currency,
    });
    if (error) throw error;
    // Exactly-once email: share the webhook's claim so a racing webhook/verify
    // can't double-send. Fulfillment is idempotent regardless.
    const { data: claimed } = await createAdminSupabase().rpc("claim_paystack_event", {
      p_reference: reference,
      p_event: "charge.success",
    });
    if (claimed === true) {
      try {
        await sendOrderNotificationsForReference(reference);
      } catch (emailError: unknown) {
        console.error("Order emails: unexpected failure", emailError instanceof Error ? emailError.message : "Unknown error");
      }
    }
    return NextResponse.json({ status: data === "already_paid" ? "paid" : data });
  } catch (error) {
    console.error("Paystack verification failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Payment verification failed." }, { status: 500 });
  }
}