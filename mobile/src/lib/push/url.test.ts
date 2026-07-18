import { describe, expect, it } from 'vitest';
import { pushPathFromUrl } from './url';

describe('pushPathFromUrl', () => {
  it('strips a leading locale segment', () => {
    expect(pushPathFromUrl('/th/ramadan')).toBe('/ramadan');
    expect(pushPathFromUrl('/ar/islamic-calendar')).toBe('/islamic-calendar');
  });

  it('leaves a path without a locale prefix untouched', () => {
    expect(pushPathFromUrl('/ramadan')).toBe('/ramadan');
  });

  it('strips origin, query and hash', () => {
    expect(pushPathFromUrl('https://muslimguide.example/th/eid?utm=x#top')).toBe('/eid');
  });

  it('collapses a locale-only path to root', () => {
    expect(pushPathFromUrl('/th')).toBe('/');
    expect(pushPathFromUrl('/en/')).toBe('/');
  });

  it('falls back to "/" for empty/nullish', () => {
    expect(pushPathFromUrl('')).toBe('/');
    expect(pushPathFromUrl(null)).toBe('/');
    expect(pushPathFromUrl(undefined)).toBe('/');
  });
});
