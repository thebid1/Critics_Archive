import { NextResponse } from "next/server";
import { createAdminAuthClient } from "@/lib/supabase/admin-auth";

export const dynamic = "force-dynamic";

export async function POST() {
  const supabase = await createAdminAuthClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    return NextResponse.json({ error: "Could not sign out." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}