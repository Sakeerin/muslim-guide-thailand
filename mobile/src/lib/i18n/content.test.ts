import { describe, expect, it } from 'vitest';
import { resolveI18n } from './content';

describe('resolveI18n', () => {
  const field = { th: 'ร้านอาหาร', en: 'Restaurant', ar: 'مطعم' };

  it('returns the requested locale', () => {
    expect(resolveI18n(field, 'th')).toBe('ร้านอาหาร');
    expect(resolveI18n(field, 'ar')).toBe('مطعم');
  });

  it('falls back requested → en → th → any', () => {
    expect(resolveI18n(field, 'ms')).toBe('Restaurant'); // no ms → en
    expect(resolveI18n({ th: 'เฉพาะไทย' }, 'ms')).toBe('เฉพาะไทย'); // no en → th
    expect(resolveI18n({ id: 'hanya id' }, 'ms')).toBe('hanya id'); // no en/th → any
  });

  it('returns empty string for null/undefined/empty', () => {
    expect(resolveI18n(null, 'en')).toBe('');
    expect(resolveI18n(undefined, 'en')).toBe('');
    expect(resolveI18n({}, 'en')).toBe('');
  });
});
