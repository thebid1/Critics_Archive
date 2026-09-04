import { NextResponse } from "next/server";
import { createAdminAuthClient } from "@/lib/supabase/admin-auth";
import { isAllowedAdminEmail } from "@/lib/admin/allowlist";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Request a magic-link login. Behaviour deliberately mirrors Supabase's own
 * anti-enumeration stance: non-allow-listed emails are NOT sent a link but the
 * client gets the same generic success message either way.
 */
export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limiter = rateLimit({ ip, limit: 5, windowMs: 60_000 });
  if (!limiter.ok) {
    return NextResponse.json(
      { error: "Too many login attempts. Please wait a minute and try again." },
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

  const email =
    typeof body === "object" && body !== null && typeof (body as { email?: unknown }).email === "string"
      ? ((body as { email: string }).email.trim().toLowerCase())
      : "";

  if (!EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  if (!isAllowedAdminEmail(email)) {
    // Reported as success to avoid confirming which emails are on the list.
    return NextResponse.json({ ok: true, message: "If your email is authorized, a sign-in link is on its way." });
  }

  try {
    const supabase = createAdminAuthClient();
    // Derive the redirect origin from the REQUEST itself, not the env var: the
    // magic link must return to wherever the admin actually is (localhost in
    // dev, the real domain in prod). NEXT_PUBLIC_SITE_URL is only a fallback.
    const origin = new URL(request.url).origin;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${origin}/auth/callback?next=/admin`,
      },
    });
    if (error) {
      console.error("Magic link send failed", { email, error: error.message });
      // Same generic shape on failure so enumeration stays impractical.
      return NextResponse.json({ ok: true, message: "If your email is authorized, a sign-in link is on its way." });
    }
    return NextResponse.json({ ok: true, message: "If your email is authorized, a sign-in link is on its way." });
  } catch (reason) {
    console.error("Magic link send error", reason instanceof Error ? reason.message : "Unknown error");
    return NextResponse.json({ ok: true, message: "If your email is authorized, a sign-in link is on its way." });
  }
}