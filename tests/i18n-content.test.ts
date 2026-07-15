import { describe, expect, it } from 'vitest';
import { hasLocaleValue, resolveI18n } from '@/lib/i18n-content';

describe('resolveI18n', () => {
  const full = { th: 'ครัวไทย', en: 'Thai Kitchen', ar: 'مطبخ تايلاندي' };

  it('returns the requested locale when present', () => {
    expect(resolveI18n(full, 'ar')).toBe('مطبخ تايلاندي');
    expect(resolveI18n(full, 'th')).toBe('ครัวไทย');
  });

  it('falls back to en when the locale is missing', () => {
    expect(resolveI18n(full, 'ms')).toBe('Thai Kitchen');
    expect(resolveI18n(full, 'id')).toBe('Thai Kitchen');
  });

  it('falls back to th when neither locale nor en exist', () => {
    expect(resolveI18n({ th: 'เฉพาะไทย' }, 'ms')).toBe('เฉพาะไทย');
  });

  it('falls back to any available value as a last resort', () => {
    expect(resolveI18n({ ms: 'Hanya Melayu' }, 'id')).toBe('Hanya Melayu');
  });

  it('returns empty string for null/empty', () => {
    expect(resolveI18n(null, 'en')).toBe('');
    expect(resolveI18n(undefined, 'en')).toBe('');
    expect(resolveI18n({}, 'en')).toBe('');
  });
});

describe('hasLocaleValue', () => {
  it('detects presence of a genuine (non-fallback) translation', () => {
    const field = { th: 'ไทย', en: 'English' };
    expect(hasLocaleValue(field, 'th')).toBe(true);
    expect(hasLocaleValue(field, 'ar')).toBe(false);
    expect(hasLocaleValue(null, 'th')).toBe(false);
  });
});
