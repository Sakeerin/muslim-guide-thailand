import { defineRouting } from 'next-intl/routing';

export const locales = ['en', 'th', 'ms', 'id', 'ar'] as const;
export type Locale = (typeof locales)[number];

export const rtlLocales: readonly Locale[] = ['ar'];

export const routing = defineRouting({
  locales,
  // x-default targets international travelers
  defaultLocale: 'en',
  localePrefix: 'always',
});

export function isRtl(locale: string): boolean {
  return rtlLocales.includes(locale as Locale);
}
