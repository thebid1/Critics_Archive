import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

/**
 * Wraps fetch to disable Next.js Data Cache for Supabase reads.
 *
 * Without this, Next caches GET responses during static generation (keyed by
 * URL) and an `npm run build` can serve stale product rows from a previous
 * build. Catalogue pages are worth regenerating fresh at every build.
 */
function noStoreFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  return fetch(input, { ...init, cache: "no-store" });
}

/**
 * Server-side Supabase client for catalogue reads (Stage 2).
 *
 * Uses the NEXT_PUBLIC publishable key, so it's bound by the same RLS as the
 * browser: public-reads-only on published products. No cookies/user session yet;
 * when Supabase Auth lands (Stage 7) this can move to @supabase/ssr so admin
 * sessions flow through the cookie jar.
 */
export function createServerSupabase(): SupabaseClient<Database> {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Supabase env vars missing (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)."
    );
  }
  return createClient<Database>(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
    global: { fetch: noStoreFetch },
  });
}

/**
 * Privileged server-only client (secret key, bypasses RLS).
 * Throws if the key is absent so Stage 5+ writes (orders, stock) never
 * silently run unprivileged.
 */
export function createAdminSupabase(): SupabaseClient<Database> {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY not set — server-only secret key required for privileged writes (Stage 5+)."
    );
  }
  return createClient<Database>(supabaseUrl, key, {
    auth: { persistSession: false },
    global: { fetch: noStoreFetch },
  });
}