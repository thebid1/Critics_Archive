/**
 * Admin allow-list — the single source of truth for "who may use /admin".
 *
 * Server-only. Emails come from the ADMIN_ALLOWED_EMAILS env var
 * (comma-separated). No self-service signup exists at all: if your email is not
 * on the list you cannot log in, no matter what Supabase Auth says.
 */
const ALLOWED_EMAILS = (process.env.ADMIN_ALLOWED_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

/** Case-insensitive membership check against the allow-list. */
export function isAllowedAdminEmail(email: string): boolean {
  if (!email) return false;
  return ALLOWED_EMAILS.includes(email.trim().toLowerCase());
}

/** True when at least one email is configured (guard against an empty gate). */
export function hasAnyAllowedEmails(): boolean {
  return ALLOWED_EMAILS.length > 0;
}