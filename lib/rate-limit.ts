/**
 * Minimal in-memory per-IP rate limiter.
 *
 * Suitable for a single-instance server. On Vercel/serverless this resets per
 * function instance — fine as a first-line abuse guard; if hosted serverless,
 * replace with an external store (Upstash/Vercel KV) for a hard limit.
 */
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function rateLimit(options: {
  ip: string;
  limit?: number; // max requests
  windowMs?: number; // sliding-ish fixed window
}): { ok: boolean; remaining: number; resetAt: number } {
  const limit = options.limit ?? 20;
  const windowMs = options.windowMs ?? 60_000;
  const now = Date.now();

  // Cheap guard against unbounded map growth: prune expired entries.
  if (buckets.size > 10_000) {
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(key);
    }
  }

  const key = options.ip || "unknown";
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  existing.count += 1;
  const ok = existing.count <= limit;
  return {
    ok,
    remaining: Math.max(0, limit - existing.count),
    resetAt: existing.resetAt,
  };
} 
export function getClientIp(request: Request): string {
  // Vercel: x-forwarded-for is the standard way to see the client IP.
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}