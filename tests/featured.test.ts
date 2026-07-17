import { describe, expect, it } from 'vitest';
import { isFeatured } from '@/lib/featured';

describe('isFeatured', () => {
  const now = new Date('2026-07-17T00:00:00Z');

  it('is false when unset', () => {
    expect(isFeatured(null, now)).toBe(false);
    expect(isFeatured(undefined, now)).toBe(false);
  });

  it('is true only while featured_until is in the future', () => {
    expect(isFeatured(new Date('2026-08-01T00:00:00Z'), now)).toBe(true);
    expect(isFeatured(new Date('2026-07-01T00:00:00Z'), now)).toBe(false); // expired
  });

  it('accepts ISO strings', () => {
    expect(isFeatured('2026-08-01T00:00:00Z', now)).toBe(true);
    expect(isFeatured('2026-07-01T00:00:00Z', now)).toBe(false);
  });

  it('is not featured exactly at expiry', () => {
    expect(isFeatured(new Date('2026-07-17T00:00:00Z'), now)).toBe(false);
  });
});
