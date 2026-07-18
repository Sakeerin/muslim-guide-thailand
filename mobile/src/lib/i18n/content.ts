import type { I18nText } from '@/types/api';

/**
 * Resolve a JSONB i18n field for a locale. Fallback chain:
 * requested locale → en → th → any available value.
 * Copied from the web app (src/lib/i18n-content.ts) — kept identical so the two
 * clients render the same text. Pure.
 */
export function resolveI18n(field: I18nText | null | undefined, locale: string): string {
  if (!field) return '';
  const l = locale as keyof I18nText;
  return (
    field[l] ??
    field.en ??
    field.th ??
    Object.values(field).find((v) => typeof v === 'string' && v.length > 0) ??
    ''
  );
}
