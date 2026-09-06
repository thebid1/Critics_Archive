import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/server";
import { requireAdminRequest } from "@/lib/admin/guard";
import { readJsonBody, isRecord } from "@/lib/admin/request";
import { hashPassword } from "@/lib/password";

export const dynamic = "force-dynamic";

// site_settings has a text key (no uuid), so use a fixed nil uuid as the audit
// target_id to satisfy the admin_actions.target_id uuid NOT NULL constraint.
const NIL_UUID = "00000000-0000-0000-0000-000000000000";

export async function GET() {
  const auth = await requireAdminRequest();
  if (!auth.ok) return auth.response;

  const supabase = createAdminSupabase();
  const { data, error } = await supabase.from("site_settings").select("key, value");
  if (error) {
    console.error("admin settings GET failed", error.message);
    return NextResponse.json({ error: "Could not read settings." }, { status: 500 });
  }
  const map = new Map((data ?? []).map((r) => [r.key, r.value] as const));
  return NextResponse.json({
    enabled: map.get("password_enabled") === "true",
    hasPassword: Boolean(map.get("password_hash")),
  });
}

export async function PATCH(request: Request) {
  const auth = await requireAdminRequest();
  if (!auth.ok) return auth.response;

  const { body, error, status } = await readJsonBody(request, 4_096);
  if (error) return NextResponse.json({ error }, { status: status ?? 400 });
  if (!isRecord(body)) {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const enabled = typeof body.enabled === "boolean" ? body.enabled : null;
  const password =
    typeof body.password === "string" && body.password.trim() ? body.password.trim() : null;

  if (enabled === null && password === null) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }
  if (password && password.length < 4) {
    return NextResponse.json({ error: "Password must be at least 4 characters." }, { status: 400 });
  }

  const supabase = createAdminSupabase();

  const { data: rows } = await supabase.from("site_settings").select("key, value");
  const map = new Map((rows ?? []).map((r) => [r.key, r.value] as const));
  const wasEnabled = map.get("password_enabled") === "true";

  const updates: { key: string; value: string }[] = [];
  if (enabled !== null) updates.push({ key: "password_enabled", value: String(enabled) });
  if (password) updates.push({ key: "password_hash", value: hashPassword(password) });

  const { error: upsertError } = await supabase
    .from("site_settings")
    .upsert(updates, { onConflict: "key" });
  if (upsertError) {
    console.error("admin settings PATCH upsert failed", upsertError.message);
    return NextResponse.json({ error: "Could not save settings." }, { status: 500 });
  }

  // Audit (no hash — never write the password/hash into the audit trail).
  await supabase.from("admin_actions").insert({
    admin_email: auth.email,
    action: "site_password_updated",
    target_table: "site_settings",
    target_id: NIL_UUID,
    before: { password_enabled: wasEnabled },
    after: {
      password_enabled: enabled ?? wasEnabled,
      password_changed: password !== null,
    },
  });

  return NextResponse.json({ ok: true });
}
