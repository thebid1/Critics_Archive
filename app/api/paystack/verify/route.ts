import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/server";
import { fromPaystackMinorUnits, verifyPaystackTransaction } from "@/lib/paystack";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    if (request.headers.get("content-type")?.split(";", 1)[0] !== "application/json") {
      return NextResponse.json({ error: "JSON is required." }, { status: 415 });
    }
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > 2_048) {
      return NextResponse.json({ error: "Request is too large." }, { status: 413 });
    }
    const body = (await request.json()) as { reference?: unknown };
    if (typeof body.reference !== "string" || !/^[A-Za-z0-9_.=-]{3,100}$/.test(body.reference)) {
      return NextResponse.json({ error: "Invalid payment reference." }, { status: 400 });
    }
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
    const { data, error } = await createAdminSupabase().rpc("fulfill_paid_order", { order_reference: body.reference, paid_amount: fromPaystackMinorUnits(payment.data.amount, payment.data.currency), paid_currency: payment.data.currency });
    if (error) throw error;
    return NextResponse.json({ status: data === "already_paid" ? "paid" : data });
  } catch (error) {
    console.error("Paystack verification failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Payment verification failed." }, { status: 500 });
  }
}