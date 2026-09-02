import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/server";
import { fromPaystackMinorUnits, verifyPaystackTransaction } from "@/lib/paystack";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { sendOrderConfirmationForReference } from "@/lib/order-confirmation";

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

  // Parse the body defensively (not request.json() which throws on bad JSON).
  let body: { reference?: unknown };
  try {
    const raw = await request.text();
    if (raw.length > 2_048) return NextResponse.json({ error: "Request is too large." }, { status: 413 });
    body = JSON.parse(raw) as { reference?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  if (typeof body.reference !== "string" || !/^[A-Za-z0-9_.=-]{3,100}$/.test(body.reference)) {
    return NextResponse.json({ error: "Invalid payment reference." }, { status: 400 });
  }

  try {
    const payment = await verifyPaystackTransaction(body.reference);
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
      order_reference: body.reference,
      paid_amount: fromPaystackMinorUnits(payment.data.amount, payment.data.currency),
      paid_currency: payment.data.currency,
    });
    if (error) throw error;
    try {
      await sendOrderConfirmationForReference(body.reference);
    } catch (emailError: unknown) {
      console.error("Confirmation email: unexpected failure", emailError instanceof Error ? emailError.message : "Unknown error");
    }
    return NextResponse.json({ status: data === "already_paid" ? "paid" : data });
  } catch (error) {
    console.error("Paystack verification failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Payment verification failed." }, { status: 500 });
  }
}