/** Supported locales — mirrors the web app's src/i18n/routing.ts. */
export const LOCALES = ['en', 'th', 'ms', 'id', 'ar'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';
export const RTL_LOCALES: readonly Locale[] = ['ar'];

export function isSupportedLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

export function isRtl(locale: string): boolean {
  return (RTL_LOCALES as readonly string[]).includes(locale);
}

/**
 * Choose the best supported locale from an ordered list of candidates
 * (e.g. a persisted choice, then the device locales). Region tags like
 * "ms-MY" or "ar-SA" collapse to their base. Falls back to English. Pure.
 */
export function pickLocale(candidates: (string | undefined | null)[]): Locale {
  for (const candidate of candidates) {
    if (!candidate) continue;
    const base = candidate.split('-')[0]!.toLowerCase();
    if (isSupportedLocale(base)) return base;
  }
  return DEFAULT_LOCALE;
}
