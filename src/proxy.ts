import createMiddleware from 'next-intl/middleware';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // /admin is not localized; auth is enforced in the admin layout
  // (session lookup needs Node runtime, not edge middleware).
  if (pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  return intlMiddleware(request);
}

export const config = {
  // Skip api, static files, and Next internals
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
