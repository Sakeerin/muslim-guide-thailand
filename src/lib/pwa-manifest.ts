import type { MetadataRoute } from 'next';
import { getTranslations } from 'next-intl/server';
import { type Locale, isRtl } from '@/i18n/routing';

const ICONS: NonNullable<MetadataRoute.Manifest['icons']> = [
  { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
  { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
  { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
];

/**
 * Builds a fully localized PWA web manifest for a single locale.
 *
 * `name` / `short_name` stay literal (the brand); `description` and the shortcut
 * names come from the `manifest` namespace so every locale installs with
 * native-language strings. `lang`, `dir`, `id`, `start_url` and the shortcut
 * URLs are all locale-aware, so each locale is an independently installable app.
 *
 * Shared by the root default manifest (`src/app/manifest.ts`, which serves the
 * default locale at `/manifest.webmanifest`) and the per-locale route handler
 * (`src/app/[locale]/manifest.webmanifest/route.ts`).
 */
export async function buildLocalizedManifest(
  locale: Locale,
): Promise<MetadataRoute.Manifest> {
  const t = await getTranslations({ locale, namespace: 'manifest' });

  return {
    id: `/${locale}`,
    name: 'Muslim Guide Thailand — Halal Places & Prayer Times',
    short_name: 'Muslim Guide TH',
    description: t('description'),
    lang: locale,
    dir: isRtl(locale) ? 'rtl' : 'ltr',
    start_url: `/${locale}`,
    scope: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0f766e',
    icons: ICONS,
    shortcuts: [
      { name: t('shortcuts.prayerTimes'), url: `/${locale}/prayer-times` },
      { name: t('shortcuts.nearMe'), url: `/${locale}/nearby` },
      { name: t('shortcuts.qibla'), url: `/${locale}/qibla` },
    ],
  };
}
