import { describe, expect, it } from 'vitest';
import { buildUrl } from './client';

describe('buildUrl', () => {
  it('returns the base path when there is no query', () => {
    expect(buildUrl('/api/v1/places')).toBe('http://localhost:3000/api/v1/places');
  });

  it('appends and encodes query params', () => {
    const url = buildUrl('/api/v1/places', { city: 'hat-yai', q: 'ข้าวมันไก่' });
    expect(url).toContain('city=hat-yai');
    expect(url).toContain(`q=${encodeURIComponent('ข้าวมันไก่')}`);
    expect(url.startsWith('http://localhost:3000/api/v1/places?')).toBe(true);
  });

  it('drops undefined / null / empty-string params', () => {
    const url = buildUrl('/api/v1/places', { city: 'bangkok', type: undefined, q: null, category: '' });
    expect(url).toBe('http://localhost:3000/api/v1/places?city=bangkok');
  });

  it('serializes numbers and booleans', () => {
    const url = buildUrl('/api/v1/places', { lat: 13.75, openNow: true, limit: 20 });
    expect(url).toContain('lat=13.75');
    expect(url).toContain('openNow=true');
    expect(url).toContain('limit=20');
  });

  it('uses & when the path already has a query string', () => {
    expect(buildUrl('/api/v1/places?a=1', { b: 2 })).toBe('http://localhost:3000/api/v1/places?a=1&b=2');
  });

  it('leaves absolute URLs intact', () => {
    expect(buildUrl('https://x.test/y')).toBe('https://x.test/y');
  });
});
