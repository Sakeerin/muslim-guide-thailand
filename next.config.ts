import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  output: 'standalone',
  // web-push is a CommonJS package that pulls in Node crypto (jws/asn1.js) —
  // keep it external so Turbopack doesn't try to bundle it into the standalone
  // server output.
  serverExternalPackages: ['web-push'],
  async headers() {
    return [
      {
        // the hand-written service worker must never be served stale, or users
        // keep an SW without the push/notificationclick handlers.
        source: '/sw.js',
        headers: [
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
