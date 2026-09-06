/**
 * Edge-safe helpers for the pre-launch password gate. No `node:crypto` — the
 * middleware (edge runtime) imports this, so it uses fetch + the Web Crypto API.
 */
export const SITE_UNLOCK_COOKIE = "site_unlock";

export type SiteGateSettings = { enabled: boolean; hash: string | null };

/** Read the gate flag + password hash in one key-value fetch. Fails open. */
export async function getSiteGateSettings(): Promise<SiteGateSettings> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!url || !key) return { enabled: false, hash: null };
  try {
    const res = await fetch(`${url}/rest/v1/site_settings?select=key,value`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });
    if (!res.ok) return { enabled: false, hash: null };
    const rows = (await res.json()) as { key: string; value: string }[];
    const map = new Map(rows.map((r) => [r.key, r.value]));
    return {
      enabled: map.get("password_enabled") === "true",
      hash: map.get("password_hash") ?? null,
    };
  } catch {
    return { enabled: false, hash: null };
  }
}

function gateSecret(): string {
  return process.env.SITE_GATE_SECRET ?? "";
}

async function hmacSha256Hex(secret: string, data: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Signed unlock token — HMAC of the current password hash. */
export async function signUnlock(passwordHash: string): Promise<string> {
  return hmacSha256Hex(gateSecret(), passwordHash);
}

export async function isValidUnlock(
  cookieValue: string,
  passwordHash: string
): Promise<boolean> {
  if (!cookieValue) return false;
  const expected = await signUnlock(passwordHash);
  return expected === cookieValue;
}
