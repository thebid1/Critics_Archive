import { NextResponse } from "next/server";
import { createAdminAuthClient } from "@/lib/supabase/admin-auth";
import { hasAnyAllowedEmails, isAllowedAdminEmail } from "@/lib/admin/allowlist";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Request a magic-link login. Behaviour deliberately mirrors Supabase's own
 * anti-enumeration stance: non-allow-listed emails are NOT sent a link but the
 * client gets the same generic success message either way.
 */
export async function POST(request: Request) {
  // Loud, server-side hint when nobody is configured to sign in at all.
  if (!hasAnyAllowedEmails()) {
    console.error("ADMIN_ALLOWED_EMAILS is empty — no admin can sign in until it is set.");
  }

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
    // Resolve the PUBLIC origin deterministically. On Vercel, the real host/proto
    // arrive in x-forwarded-* headers; reading them (rather than request.url or
    // an env var) guarantees the magic link returns to prod — never localhost.
    const forwardedHost =
      request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    const forwardedProto = request.headers.get("x-forwarded-proto");
    const origin =
      forwardedHost && forwardedProto
        ? `${forwardedProto}://${forwardedHost}`
        : new URL(request.url).origin;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${origin}/auth/callback?next=/admin`,
      },
    });
    if (error) {
      // This email IS allow-listed, so surfacing the real reason is safe (the
      // person is an admin) and directly actionable — "redirect_to not allowed",
      // email provider off, rate limited, custom SMTP missing, etc.
      console.error("Magic link send failed", { error: error.message });
      return NextResponse.json(
        { ok: false, error: `Sign-in link could not be sent: ${error.message}` },
        { status: 500 }
      );
    }
    return NextResponse.json({ ok: true, message: "If your email is authorized, a sign-in link is on its way." });
  } catch (reason) {
    console.error("Magic link send error", reason instanceof Error ? reason.message : "Unknown error");
    return NextResponse.json(
      { ok: false, error: "Sign-in link could not be sent. Please try again." },
      { status: 500 }
    );
  }
}