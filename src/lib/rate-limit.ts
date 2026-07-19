/**
 * Minimal fixed-window rate limiter (in-memory). Suitable for the single-VPS
 * MVP deployment; it is per-instance (not shared across replicas) — swap the
 * store for Redis/Postgres if the app is ever scaled horizontally.
 *
 * The window math is a pure function (`evaluateBucket`) so it unit-tests
 * without touching the module-level store or the clock.
 */

export interface Bucket {
  count: number;
  resetAt: number; // epoch ms when the window resets
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
}

/** Pure: given the current bucket (or undefined) and now, decide + return the
 *  next bucket. A fresh/expired window resets to count 1. */
export function evaluateBucket(
  bucket: Bucket | undefined,
  now: number,
  max: number,
  windowMs: number,
): { bucket: Bucket; result: RateLimitResult } {
  if (!bucket || now >= bucket.resetAt) {
    const fresh: Bucket = { count: 1, resetAt: now + windowMs };
    return { bucket: fresh, result: { allowed: true, remaining: max - 1, retryAfterSec: 0 } };
  }
  if (bucket.count < max) {
    const next: Bucket = { count: bucket.count + 1, resetAt: bucket.resetAt };
    return { bucket: next, result: { allowed: true, remaining: max - next.count, retryAfterSec: 0 } };
  }
  // over the limit — keep the bucket as-is, report retry-after
  return {
    bucket,
    result: { allowed: false, remaining: 0, retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000) },
  };
}

const store = new Map<string, Bucket>();

/** Consume one unit against `key`. Not pure (uses the store + clock). */
export function consumeRateLimit(
  key: string,
  max: number,
  windowMs: number,
  now: number = Date.now(),
): RateLimitResult {
  const { bucket, result } = evaluateBucket(store.get(key), now, max, windowMs);
  store.set(key, bucket);
  if (store.size > 10_000) sweep(now); // opportunistic cleanup of expired buckets
  return result;
}

function sweep(now: number): void {
  for (const [k, b] of store) if (now >= b.resetAt) store.delete(k);
}
