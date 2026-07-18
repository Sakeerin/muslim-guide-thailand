import { describe, expect, it } from 'vitest';
import { needsRtlFlip } from './rtl';

describe('needsRtlFlip', () => {
  it('flips when switching to Arabic from an LTR layout', () => {
    expect(needsRtlFlip('ar', false)).toBe(true);
  });

  it('flips when leaving Arabic for an LTR locale', () => {
    expect(needsRtlFlip('en', true)).toBe(true);
  });

  it('does not flip when direction already matches', () => {
    expect(needsRtlFlip('ar', true)).toBe(false);
    expect(needsRtlFlip('th', false)).toBe(false);
  });
});
