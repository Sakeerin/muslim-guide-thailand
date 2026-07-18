import { describe, expect, it } from 'vitest';
import { DEFAULT_LOCALE, isRtl, isSupportedLocale, pickLocale } from './locale';

describe('isSupportedLocale', () => {
  it('accepts the five locales, rejects others', () => {
    expect(isSupportedLocale('ar')).toBe(true);
    expect(isSupportedLocale('th')).toBe(true);
    expect(isSupportedLocale('fr')).toBe(false);
  });
});

describe('isRtl', () => {
  it('is true only for Arabic', () => {
    expect(isRtl('ar')).toBe(true);
    expect(isRtl('en')).toBe(false);
    expect(isRtl('th')).toBe(false);
  });
});

describe('pickLocale', () => {
  it('returns the first supported candidate', () => {
    expect(pickLocale(['ms', 'en'])).toBe('ms');
  });

  it('collapses region tags to base language', () => {
    expect(pickLocale(['ar-SA'])).toBe('ar');
    expect(pickLocale(['ms-MY', 'en-US'])).toBe('ms');
  });

  it('skips unsupported and null candidates', () => {
    expect(pickLocale([null, undefined, 'fr', 'id-ID'])).toBe('id');
  });

  it('falls back to the default locale', () => {
    expect(pickLocale([null, 'zz'])).toBe(DEFAULT_LOCALE);
    expect(pickLocale([])).toBe(DEFAULT_LOCALE);
  });
});
