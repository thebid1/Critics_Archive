import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

/**
 * Browser-safe Supabase client (NEXT_PUBLIC publishable key, RLS-enforced).
 * Import from client components only — for server-side catalogue reads use
 * createServerSupabase from "@/lib/supabase/server".
 */
export function createBrowserSupabase(): SupabaseClient<Database> {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Supabase env vars missing (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)."
    );
  }
  return createClient<Database>(supabaseUrl, supabaseKey);
}