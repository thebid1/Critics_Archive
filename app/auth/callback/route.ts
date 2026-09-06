import { NextResponse } from "next/server";
import { createAdminAuthClient } from "@/lib/supabase/admin-auth";
import { isAllowedAdminEmail } from "@/lib/admin/allowlist";

/**
 * Supabase Auth magic-link callback (/auth/callback?code=...&next=/admin).
 *
 * Exchanges the PKCE code for a session (stored in httpOnly cookies by
 * @supabase/ssr), then enforces the allow-list. A user who is NOT on the
 * allow-list is signed straight back out — they never reach /admin.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/admin";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/admin";

  if (code) {
    const supabase = await createAdminAuthClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.email && isAllowedAdminEmail(user.email)) {
        return NextResponse.redirect(`${origin}${safeNext}`);
      }
      await supabase.auth.signOut();
      return NextResponse.redirect(`${origin}/login?error=unauthorized`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}