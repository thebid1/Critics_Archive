import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Vercel Cron: releases stock reserved by stale pending orders (abandoned
 * checkouts) even when no new checkout occurs. Vercel invokes this on the
 * schedule in vercel.json, authenticated via the CRON_SECRET header.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization") ?? "";
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { data, error } = await createAdminSupabase().rpc("expire_pending_orders", {
      p_max_age_hours: 24,
    });
    if (error) throw error;
    return NextResponse.json({ ok: true, restored: data ?? 0 });
  } catch (error) {
    console.error("Cron expire_pending_orders failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Cron failed." }, { status: 500 });
  }
}