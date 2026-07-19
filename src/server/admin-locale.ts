import { cookies } from 'next/headers';
import { routing, type Locale } from '@/i18n/routing';

/**
 * Language for the admin (staff) UI. Defaults to Thai — the ops team's language
 * — independent of the public site's locale, and switchable via the
 * `admin_locale` cookie (validated against the supported locales). Admin routes
 * live outside the `[locale]` segment, so next-intl has no request locale here;
 * this is the single place that decides it.
 */
const ADMIN_LOCALE_COOKIE = 'admin_locale';
const ADMIN_DEFAULT_LOCALE: Locale = 'th';

export async function getAdminLocale(): Promise<Locale> {
  const value = (await cookies()).get(ADMIN_LOCALE_COOKIE)?.value;
  return routing.locales.includes(value as Locale) ? (value as Locale) : ADMIN_DEFAULT_LOCALE;
}
