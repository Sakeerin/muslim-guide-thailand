import { describe, expect, it } from 'vitest';
import { consumeRateLimit, evaluateBucket } from '@/lib/rate-limit';

describe('evaluateBucket', () => {
  const max = 3;
  const win = 10_000;

  it('opens a fresh window on the first hit', () => {
    const { bucket, result } = evaluateBucket(undefined, 1000, max, win);
    expect(result).toEqual({ allowed: true, remaining: 2, retryAfterSec: 0 });
    expect(bucket).toEqual({ count: 1, resetAt: 11_000 });
  });

  it('counts up within the window', () => {
    const b1 = evaluateBucket(undefined, 0, max, win).bucket;
    const b2 = evaluateBucket(b1, 1000, max, win);
    expect(b2.result.allowed).toBe(true);
    expect(b2.bucket.count).toBe(2);
  });

  it('denies once the limit is reached and reports retry-after', () => {
    let b = evaluateBucket(undefined, 0, max, win).bucket; // 1
    b = evaluateBucket(b, 0, max, win).bucket; // 2
    b = evaluateBucket(b, 0, max, win).bucket; // 3 (== max)
    const over = evaluateBucket(b, 3000, max, win);
    expect(over.result.allowed).toBe(false);
    expect(over.result.retryAfterSec).toBe(7); // (10000-3000)/1000
    expect(over.bucket.count).toBe(3); // unchanged
  });

  it('resets after the window elapses', () => {
    const first = evaluateBucket(undefined, 0, max, win).bucket; // resetAt 10000
    const after = evaluateBucket(first, 10_000, max, win); // now == resetAt
    expect(after.result.allowed).toBe(true);
    expect(after.bucket).toEqual({ count: 1, resetAt: 20_000 });
  });
});

describe('consumeRateLimit (store-backed)', () => {
  it('allows up to max then denies for the same key', () => {
    const key = `test-${Math.random()}`; // unique per run (module store persists)
    const now = 1_000_000;
    expect(consumeRateLimit(key, 2, 60_000, now).allowed).toBe(true);
    expect(consumeRateLimit(key, 2, 60_000, now).allowed).toBe(true);
    expect(consumeRateLimit(key, 2, 60_000, now).allowed).toBe(false);
    // a different key has its own bucket
    expect(consumeRateLimit(`${key}-other`, 2, 60_000, now).allowed).toBe(true);
  });
});
