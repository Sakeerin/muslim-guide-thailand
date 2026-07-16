import { describe, expect, it } from 'vitest';
import {
  decideReviewStatus,
  NEW_ACCOUNT_WINDOW_MS,
  screenReview,
} from '@/lib/review-moderation';

describe('screenReview', () => {
  it('does not flag clean experience reviews', () => {
    expect(screenReview('อร่อยมาก บริการดี ที่จอดรถสะดวก').riskFlag).toBe(false);
    expect(screenReview('Great biryani, friendly staff, clean prayer room').riskFlag).toBe(false);
    expect(screenReview('').riskFlag).toBe(false);
    expect(screenReview(null).riskFlag).toBe(false);
  });

  it('flags halal-status accusations across languages', () => {
    expect(screenReview('ร้านนี้ไม่ฮาลาลจริง').riskFlag).toBe(true);
    expect(screenReview('this place is not halal').riskFlag).toBe(true);
    expect(screenReview('sebenarnya tidak halal').riskFlag).toBe(true);
    expect(screenReview('المطعم غير حلال').riskFlag).toBe(true);
  });

  it('flags pork/alcohol contamination and fraud claims', () => {
    expect(screenReview('เห็นเขาใส่หมูด้วย').riskFlag).toBe(true);
    expect(screenReview('they serve alcohol here').riskFlag).toBe(true);
    expect(screenReview('ร้านนี้หลอกลูกค้า').riskFlag).toBe(true);
    expect(screenReview('total scam, they cheat you').riskFlag).toBe(true);
  });

  it('flags health/contamination accusations', () => {
    expect(screenReview('got food poisoning here').riskFlag).toBe(true);
    expect(screenReview('เจอแมลงสาบในจาน').riskFlag).toBe(true);
  });

  it('is case-insensitive and returns matched terms', () => {
    const r = screenReview('This is a SCAM');
    expect(r.riskFlag).toBe(true);
    expect(r.matchedTerms).toContain('scam');
  });

  it('resists trivial evasions (spacing, zero-width, full-width, homoglyph)', () => {
    expect(screenReview('ร้านนี้ ไม่ ฮาลาล').riskFlag).toBe(true); // injected spaces
    expect(screenReview('ไม่​ฮาลาล').riskFlag).toBe(true); // zero-width space
    expect(screenReview('ｎｏｔ　ｈａｌａｌ').riskFlag).toBe(true); // full-width + ideographic space
    expect(screenReview('this is a ѕсаm').riskFlag).toBe(true); // cyrillic homoglyphs
    expect(screenReview('n o t   h a l a l').riskFlag).toBe(true); // fully spaced
  });
});

describe('decideReviewStatus', () => {
  const OLD = NEW_ACCOUNT_WINDOW_MS + 1;
  const NEW = NEW_ACCOUNT_WINDOW_MS - 1;

  it('publishes star-only reviews from established accounts', () => {
    expect(decideReviewStatus({ hasBody: false, riskFlag: false, accountAgeMs: OLD })).toBe('published');
  });

  it('holds star-only reviews from brand-new accounts (anti rating-manipulation)', () => {
    expect(decideReviewStatus({ hasBody: false, riskFlag: false, accountAgeMs: NEW })).toBe('pending');
  });

  it('holds risk-flagged text for pre-moderation', () => {
    expect(decideReviewStatus({ hasBody: true, riskFlag: true, accountAgeMs: OLD })).toBe('pending');
  });

  it('holds brand-new-account text reviews', () => {
    expect(decideReviewStatus({ hasBody: true, riskFlag: false, accountAgeMs: NEW })).toBe('pending');
  });

  it('post-moderates (publishes) clean text from established accounts', () => {
    expect(decideReviewStatus({ hasBody: true, riskFlag: false, accountAgeMs: OLD })).toBe('published');
  });
});
