import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function page(message: string): NextResponse {
  const html = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1" /></head><body style="margin:0;background:#0a0a09;color:#f2ede2;font-family:Arial,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center"><div style="max-width:420px;padding:24px"><h1 style="font-size:20px;letter-spacing:1px;text-transform:uppercase">${message}</h1><p style="margin-top:12px;color:#8a877e;font-size:14px">CRITICS ARCHIVE — SWAG IS ART.</p></div></body></html>`;
  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  if (!token) {
    return page("Invalid unsubscribe link.");
  }

  const { error } = await createAdminSupabase()
    .from("newsletter_subscribers")
    .update({ unsubscribed_at: new Date().toISOString() })
    .eq("id", token)
    .is("unsubscribed_at", null);

  if (error) {
    console.error("Unsubscribe failed", error.message);
    return page("Something went wrong. Please try again.");
  }

  return page("You&apos;ve been unsubscribed.");
}