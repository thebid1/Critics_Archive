import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/server";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { newsletterSchema } from "@/lib/validation";
import { sendNewsletterWelcomeEmail } from "@/lib/resend";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // Rate limit sign-ups per IP (first-line; see security.md re: shared store).
  const ip = getClientIp(request);
  const limiter = rateLimit({ ip, limit: 5, windowMs: 60_000 });
  if (!limiter.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429 }
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
  if (raw.length > 1_024) {
    return NextResponse.json({ error: "Request is too large." }, { status: 413 });
  }

  let body: unknown;
  try {
    body = JSON.parse(raw) as unknown;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = newsletterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  try {
    const supabase = createAdminSupabase();
    const { data, error } = await supabase
      .from("newsletter_subscribers")
      .insert({ email: parsed.data.email })
      .select("id")
      .single();
    if (error) {
      // Duplicate email → treat as success (idempotent subscribe), no re-send.
      if (error.code === "23505") {
        return NextResponse.json({ ok: true });
      }
      throw error;
    }

    // Welcome email (best-effort — a send failure never fails the subscribe).
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const subscriberId = (data as { id: string }).id;
    const sendError = await sendNewsletterWelcomeEmail({
      email: parsed.data.email,
      unsubscribeUrl: `${siteUrl}/api/unsubscribe?token=${subscriberId}`,
      shopUrl: `${siteUrl}/#shop`,
    });
    if (sendError) {
      console.error("Newsletter welcome email failed", { error: sendError });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Newsletter subscribe failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Could not subscribe. Please try again." }, { status: 500 });
  }
}