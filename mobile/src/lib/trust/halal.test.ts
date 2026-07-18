import { describe, expect, it } from 'vitest';
import { halalLabelKey, halalTone, isFeatured, trustRank } from './halal';

describe('trustRank', () => {
  it('orders certified > owned > friendly > unverified/unknown', () => {
    expect(trustRank('cicot_certified')).toBeGreaterThan(trustRank('muslim_owned'));
    expect(trustRank('muslim_owned')).toBeGreaterThan(trustRank('muslim_friendly'));
    expect(trustRank('muslim_friendly')).toBeGreaterThan(trustRank('unverified'));
    expect(trustRank('anything-else')).toBe(0);
  });
});

describe('halalLabelKey', () => {
  it('passes known statuses through, maps unknown to unverified', () => {
    expect(halalLabelKey('cicot_certified')).toBe('cicot_certified');
    expect(halalLabelKey('garbage')).toBe('unverified');
  });
});

describe('halalTone', () => {
  it('maps each status to a tone', () => {
    expect(halalTone('cicot_certified')).toBe('certified');
    expect(halalTone('muslim_owned')).toBe('owned');
    expect(halalTone('muslim_friendly')).toBe('friendly');
    expect(halalTone('unverified')).toBe('unverified');
    expect(halalTone('???')).toBe('unverified');
  });
});

describe('isFeatured', () => {
  const now = new Date('2026-07-18T00:00:00Z');

  it('is false when unset or invalid', () => {
    expect(isFeatured(null, now)).toBe(false);
    expect(isFeatured(undefined, now)).toBe(false);
    expect(isFeatured('not-a-date', now)).toBe(false);
  });

  it('is true only while the window is in the future (strict)', () => {
    expect(isFeatured('2026-08-01T00:00:00Z', now)).toBe(true);
    expect(isFeatured('2026-07-01T00:00:00Z', now)).toBe(false);
    expect(isFeatured('2026-07-18T00:00:00Z', now)).toBe(false); // exactly now
  });

  it('accepts Date instances', () => {
    expect(isFeatured(new Date('2026-08-01T00:00:00Z'), now)).toBe(true);
  });
});
