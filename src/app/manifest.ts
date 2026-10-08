import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { buildLocalizedManifest } from '@/lib/pwa-manifest';

// Root-level metadata route (NOT under [locale]) — served at /manifest.webmanifest.
// This is the default-locale fallback for bare /manifest.webmanifest requests
// (external PWA probes, crawlers). Each locale additionally serves its own
// localized manifest at /{locale}/manifest.webmanifest, which the localized
// <head> links to (see src/app/[locale]/layout.tsx).
export default function manifest(): Promise<MetadataRoute.Manifest> {
  return buildLocalizedManifest(routing.defaultLocale);
}
