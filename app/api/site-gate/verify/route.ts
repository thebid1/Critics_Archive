import { NextResponse } from "next/server";
import {
  getSiteGateSettings,
  signUnlock,
  SITE_UNLOCK_COOKIE,
} from "@/lib/site-gate";
import { verifyPassword } from "@/lib/password";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limiter = rateLimit({ ip, limit: 10, windowMs: 60_000 });
  if (!limiter.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again shortly." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((limiter.resetAt - Date.now()) / 1000)) },
      }
    );
  }

  if (request.headers.get("content-type")?.split(";", 1)[0] !== "application/json") {
    return NextResponse.json({ error: "JSON is required." }, { status: 415 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const password =
    body && typeof body === "object" && "password" in body
      ? (body as { password?: unknown }).password
      : undefined;

  if (typeof password !== "string" || !password) {
    return NextResponse.json({ error: "Enter the password." }, { status: 400 });
  }

  const { enabled, hash } = await getSiteGateSettings();
  if (!enabled || !hash) {
    // Gate not active — nothing to verify.
    return NextResponse.json({ ok: true });
  }

  if (!verifyPassword(password, hash)) {
    return NextResponse.json({ error: "Wrong password." }, { status: 401 });
  }

  const token = await signUnlock(hash);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SITE_UNLOCK_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return res;
}
