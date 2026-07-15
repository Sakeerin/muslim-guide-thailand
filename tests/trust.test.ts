import { describe, expect, it } from 'vitest';
import {
  addMonths,
  expiryBucket,
  isFourEyesRequired,
  nextReviewDate,
  REVIEW_INTERVAL_MONTHS,
} from '@/lib/trust';

describe('isFourEyesRequired', () => {
  it('requires a second reviewer for L1 and L2', () => {
    expect(isFourEyesRequired('cicot_certified')).toBe(true);
    expect(isFourEyesRequired('muslim_owned')).toBe(true);
  });
  it('does not require it for L3/L4', () => {
    expect(isFourEyesRequired('muslim_friendly')).toBe(false);
    expect(isFourEyesRequired('unverified')).toBe(false);
  });
});

describe('expiryBucket', () => {
  it('classifies by days remaining', () => {
    expect(expiryBucket(-1)).toBe('expired');
    expect(expiryBucket(0)).toBe('lte30');
    expect(expiryBucket(30)).toBe('lte30');
    expect(expiryBucket(31)).toBe('lte60');
    expect(expiryBucket(60)).toBe('lte60');
    expect(expiryBucket(90)).toBe('lte90');
    expect(expiryBucket(120)).toBe('later');
  });
});

describe('review scheduling', () => {
  it('adds months across a year boundary', () => {
    const result = addMonths(new Date('2026-10-15T00:00:00Z'), 6);
    expect(result.getUTCFullYear()).toBe(2027);
    expect(result.getUTCMonth()).toBe(3); // April (0-based)
  });

  it('nextReviewDate is REVIEW_INTERVAL_MONTHS ahead', () => {
    const from = new Date('2026-01-15T00:00:00Z');
    const due = nextReviewDate(from);
    expect(due.getUTCMonth()).toBe((from.getUTCMonth() + REVIEW_INTERVAL_MONTHS) % 12);
  });
});
