import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Server-side Supabase client wired to the HTTP cookie jar (Stage 7 admin auth).
 *
 * This is the ONLY client that can read/write the admin session: pages and route
 * handlers create it per-request, @supabase/ssr stores the session in httpOnly
 * cookies, and it is never imported from client components. The public
 * storefront never touches this client — cookies are only ever used under
 * /admin, /login and /auth/callback.
 *
 * Same publishable key as everywhere else: Supabase Auth (magic link) is
 * enforced by Supabase Auth itself; the allow-list check in lib/admin/guard.ts
 * is what keeps non-listed users out of admin data.
 */
export async function createAdminAuthClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
  if (!url || !key) {
    throw new Error(
      "Supabase env vars missing (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)."
    );
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from a Server Component. Safe to ignore when middleware
          // refreshes sessions before the response is committed.
        }
      },
    },
  });
}