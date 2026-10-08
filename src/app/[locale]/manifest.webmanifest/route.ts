import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { routing, type Locale } from '@/i18n/routing';
import { buildLocalizedManifest } from '@/lib/pwa-manifest';

// Per-locale PWA manifest, served at /{locale}/manifest.webmanifest.
// The `manifest` metadata-file convention is root-only in Next 16 (its matcher
// is anchored to the app root), so a localized manifest is a plain Route Handler
// nested under [locale] instead. It is excluded from the intl proxy (the matcher
// skips any path containing a dot), so it resolves directly with params.locale.
export const dynamicParams = false;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const manifest = await buildLocalizedManifest(locale as Locale);
  return new Response(JSON.stringify(manifest), {
    headers: { 'Content-Type': 'application/manifest+json' },
  });
}
