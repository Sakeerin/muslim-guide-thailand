import { describe, expect, it } from 'vitest';
import { normalizeReviewBody, REVIEW_CONSENTS } from './reviews';

describe('normalizeReviewBody', () => {
  it('trims surrounding whitespace but keeps the text', () => {
    expect(normalizeReviewBody('  great halal food ')).toBe('great halal food');
  });

  it('treats empty / whitespace-only / nullish as no body (star-only review)', () => {
    expect(normalizeReviewBody('   ')).toBeUndefined();
    expect(normalizeReviewBody('')).toBeUndefined();
    expect(normalizeReviewBody(undefined)).toBeUndefined();
    expect(normalizeReviewBody(null)).toBeUndefined();
  });
});

describe('REVIEW_CONSENTS', () => {
  it('records privacy_policy + review_publication (matches the web register flow)', () => {
    expect([...REVIEW_CONSENTS]).toEqual(['privacy_policy', 'review_publication']);
  });
});
