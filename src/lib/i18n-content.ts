import type { I18nText } from '@/server/db/schema/types';

export type ContentLocale = 'th' | 'en' | 'ms' | 'id' | 'ar';

/**
 * Resolve a JSONB i18n field for a locale.
 * Fallback chain: requested locale → en → th → any available value.
 * Central helper — no page may fall back silently on its own.
 */
export function resolveI18n(
  field: I18nText | null | undefined,
  locale: string,
): string {
  if (!field) return '';
  const l = locale as ContentLocale;
  return (
    field[l] ??
    field.en ??
    field.th ??
    Object.values(field).find((v) => typeof v === 'string' && v.length > 0) ??
    ''
  );
}

/** True when the requested locale has its own (non-fallback) value. */
export function hasLocaleValue(field: I18nText | null | undefined, locale: string): boolean {
  return Boolean(field?.[locale as ContentLocale]);
}
