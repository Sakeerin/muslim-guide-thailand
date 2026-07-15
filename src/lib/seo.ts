import { locales } from '@/i18n/routing';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

/**
 * hreflang alternates for a localized path (path WITHOUT locale prefix).
 * x-default → en (international travelers).
 */
export function alternatesFor(path: string) {
  const clean = path.startsWith('/') ? path : `/${path}`;
  const languages: Record<string, string> = {};
  for (const locale of locales) {
    languages[locale] = `${SITE_URL}/${locale}${clean === '/' ? '' : clean}`;
  }
  languages['x-default'] = `${SITE_URL}/en${clean === '/' ? '' : clean}`;
  return {
    canonical: undefined, // per-locale canonical handled by Next metadata merge
    languages,
  };
}

export { SITE_URL };
