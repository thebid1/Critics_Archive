import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { createAdminAuthClient } from "@/lib/supabase/admin-auth";
import { isAllowedAdminEmail } from "@/lib/admin/allowlist";

/**
 * Stage 7 gate. Rules from the client spec:
 *  - every /admin page and every admin route handler independently verifies the
 *    session belongs to an allow-listed email server-side (middleware is only a
 *    UX shell — it never gates data);
 *  - the check runs on EVERY request, not just page load;
 *  - non-listed users get signed out here, not just blocked.
 */
export async function getAdminUser(): Promise<{ email: string } | null> {
  const supabase = await createAdminAuthClient();
  const { data, error } = await supabase.auth.getUser();
  const email = data.user?.email;
  if (error || !email || !isAllowedAdminEmail(email)) {
    if (email) await supabase.auth.signOut();
    return null;
  }
  return { email };
}

/** For Server Components (pages): redirects to the login page when unauthenticated. */
export async function requireAdmin(redirectTo = "/login"): Promise<{ email: string }> {
  const user = await getAdminUser();
  if (!user) redirect(redirectTo);
  return user;
}

/** For Route Handlers: returns a discriminated union; callers short-circuit with `auth.response`. */
export async function requireAdminRequest(): Promise<
  | { ok: true; email: string }
  | { ok: false; response: NextResponse }
> {
  const user = await getAdminUser();
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized." }, { status: 401 }),
    };
  }
  return { ok: true, email: user.email };
}