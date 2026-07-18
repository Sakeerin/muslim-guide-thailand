import { describe, expect, it } from 'vitest';
import { fmtDistance } from './number';

describe('fmtDistance', () => {
  it('shows metres below ~1km', () => {
    expect(fmtDistance(0)).toEqual({ value: '0', unit: 'm' });
    expect(fmtDistance(320)).toEqual({ value: '320', unit: 'm' });
    expect(fmtDistance(949)).toEqual({ value: '949', unit: 'm' });
  });

  it('shows km with one decimal under 10km', () => {
    expect(fmtDistance(1200)).toEqual({ value: '1.2', unit: 'km' });
    expect(fmtDistance(9500)).toEqual({ value: '9.5', unit: 'km' });
  });

  it('rounds to whole km at 10km and above', () => {
    expect(fmtDistance(12300)).toEqual({ value: '12', unit: 'km' });
  });

  it('handles invalid input', () => {
    expect(fmtDistance(-5)).toEqual({ value: '—', unit: 'm' });
    expect(fmtDistance(Number.NaN)).toEqual({ value: '—', unit: 'm' });
  });
});
