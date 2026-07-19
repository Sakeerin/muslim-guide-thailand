import { toNextJsHandler } from 'better-auth/next-js';
import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { RATE_LIMITS, checkRateLimit, clientIp } from '@/lib/rate-limit-guard';

const handler = toNextJsHandler(auth);

export const GET = handler.GET;

/**
 * Rate-limit the credential endpoints (per IP) before delegating to Better
 * Auth — caps password-guessing and mass account creation. Everything else
 * passes straight through.
 */
export async function POST(request: NextRequest): Promise<Response> {
  const path = request.nextUrl.pathname;
  const cfg = path.endsWith('/sign-up/email')
    ? RATE_LIMITS.authSignUp
    : path.endsWith('/sign-in/email')
      ? RATE_LIMITS.authSignIn
      : null;

  if (cfg) {
    const rl = checkRateLimit(clientIp(request), cfg);
    if (!rl.allowed) {
      return NextResponse.json(
        { message: 'Too many requests — please slow down.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } },
      );
    }
  }

  return handler.POST(request);
}
