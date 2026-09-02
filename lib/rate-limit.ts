/** Simple in-memory sliding-window rate limiter (research.md §26).
 *
 * Returns a result object instead of a bare boolean so routes can send a
 * standards-compliant `Retry-After` header (and a friendly retry hint in
 * the body) instead of a bare 429 sentence.
 */
const buckets = new Map<string, number[]>();

export interface RateLimitResult {
  ok: boolean;
  /** Seconds until the oldest hit in the window expires — 0 when allowed. */
  retryAfterSec: number;
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    const oldest = hits[0] ?? now;
    const retryAfterSec = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    return { ok: false, retryAfterSec };
  }
  hits.push(now);
  buckets.set(key, hits);

  // occasional cleanup to keep memory flat
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      if (v.every((t) => now - t > windowMs)) buckets.delete(k);
    }
  }
  return { ok: true, retryAfterSec: 0 };
}

/** Helper: build the 429 JSON body + Retry-After header consistently. */
export function rateLimitResponse(retryAfterSec: number, message: string) {
  return Response.json(
    {
      error: `${message} Please try again in about ${retryAfterSec}s.`,
      retryAfter: retryAfterSec,
    },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfterSec) },
    }
  );
}
