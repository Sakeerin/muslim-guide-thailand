import { describe, expect, it } from 'vitest';
import { pickHeading, shouldEmitHeading } from './heading-math';

describe('pickHeading', () => {
  it('prefers trueHeading when available (>= 0)', () => {
    expect(pickHeading({ trueHeading: 100, magHeading: 99 })).toBe(100);
    expect(pickHeading({ trueHeading: 0, magHeading: 50 })).toBe(0);
  });

  it('falls back to magnetic north when trueHeading is -1', () => {
    expect(pickHeading({ trueHeading: -1, magHeading: 99 })).toBe(99);
  });
});

describe('shouldEmitHeading', () => {
  it('always emits the first sample', () => {
    expect(shouldEmitHeading(null, 123)).toBe(true);
  });

  it('suppresses sub-threshold movement', () => {
    expect(shouldEmitHeading(100, 100.5)).toBe(false);
    expect(shouldEmitHeading(100, 101.5)).toBe(true);
  });

  it('measures the shortest angular distance across the 0/360 wrap', () => {
    expect(shouldEmitHeading(359.5, 0)).toBe(false); // 0.5° apart
    expect(shouldEmitHeading(359, 2)).toBe(true); // 3° apart
  });
});
