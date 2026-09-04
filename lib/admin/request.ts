/**
 * Shared request-body reader for admin route handlers: reads the raw text,
 * enforces a hard size cap even without a Content-Length header, and returns a
 * discriminated result instead of throwing. Same hardening the Stage 5 checkout
 * route uses, reused across the Stage 7 admin API.
 */
export async function readJsonBody(
  request: Request,
  maxBytes = 32_768
): Promise<
  | { body: unknown; error: null; status: null }
  | { body: null; error: string; status: number }
> {
  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return { body: null, error: "Unable to read request body.", status: 400 };
  }
  if (raw.length > maxBytes) {
    return { body: null, error: "Request is too large.", status: 413 };
  }
  try {
    return { body: JSON.parse(raw) as unknown, error: null, status: null };
  } catch {
    return { body: null, error: "Invalid JSON.", status: 400 };
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function asString(value: unknown, max = 4_000): value is string {
  return (
    typeof value === "string" && value.trim().length > 0 && value.length <= max
  );
}

export function asOptionalString(value: unknown, max = 4_000): string {
  return typeof value === "string" && value.length <= max ? value : "";
}

export function asBoolean(value: unknown): boolean {
  return value === true;
}

export function asNonNegativeInt(value: unknown): number | null {
  return typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0
    ? value
    : null;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function asUuid(value: unknown): string | null {
  return typeof value === "string" && UUID_RE.test(value) ? value : null;
}