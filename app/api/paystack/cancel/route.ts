import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/server";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const limiter = rateLimit({ ip: getClientIp(request), limit: 20, windowMs: 60_000 });
  if (!limiter.ok) return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  try {
    const body = (await request.json()) as { reference?: unknown };
    if (typeof body.reference !== "string" || !/^[A-Za-z0-9_.=-]{3,100}$/.test(body.reference)) {
      return NextResponse.json({ error: "Invalid payment reference." }, { status: 400 });
    }
    const { data, error } = await createAdminSupabase().rpc("cancel_pending_order", { order_reference: body.reference });
    if (error) throw error;
    return NextResponse.json({ status: data });
  } catch (error) {
    console.error("Payment cancellation failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Could not cancel the pending order." }, { status: 500 });
  }
}