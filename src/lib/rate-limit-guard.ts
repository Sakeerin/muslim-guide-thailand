import { type NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/api';
import { consumeRateLimit, type RateLimitResult } from '@/lib/rate-limit';

export interface RateLimitConfig {
  /** namespaces the key so different actions don't share a bucket */
  name: string;
  max: number;
  windowMs: number;
}

const MIN = 60_000;

/** Per-action limits. UGC/write actions are per signed-in user; auth actions
 *  are per IP (there is no user yet). */
export const RATE_LIMITS = {
  ugcWrite: { name: 'ugc', max: 10, windowMs: 10 * MIN }, // reviews / questions / answers
  claim: { name: 'claim', max: 5, windowMs: 60 * MIN },
  authSignUp: { name: 'signup', max: 5, windowMs: 60 * MIN },
  authSignIn: { name: 'signin', max: 10, windowMs: 15 * MIN },
} as const satisfies Record<string, RateLimitConfig>;

/** Best-effort client IP from the proxy headers. */
export function clientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

export function checkRateLimit(identifier: string, cfg: RateLimitConfig): RateLimitResult {
  return consumeRateLimit(`${cfg.name}:${identifier}`, cfg.max, cfg.windowMs);
}

/** 429 in the /api/v1 envelope, with a Retry-After header. */
export function rateLimitedResponse(result: RateLimitResult): NextResponse {
  const res = apiError(429, 'rate_limited', 'Too many requests — please slow down.');
  res.headers.set('Retry-After', String(result.retryAfterSec));
  return res;
}
