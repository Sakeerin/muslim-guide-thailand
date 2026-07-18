import { describe, expect, it } from 'vitest';
import { placesQueryParams } from './places';

describe('placesQueryParams', () => {
  it('is empty-ish for an empty query', () => {
    const p = placesQueryParams({});
    expect(p.halal).toBeUndefined();
    expect(p.openNow).toBeUndefined();
    expect(p.city).toBeUndefined();
  });

  it('joins halal statuses into a comma string', () => {
    expect(placesQueryParams({ halal: ['cicot_certified', 'muslim_owned'] }).halal).toBe(
      'cicot_certified,muslim_owned',
    );
  });

  it('omits halal when the array is empty', () => {
    expect(placesQueryParams({ halal: [] }).halal).toBeUndefined();
  });

  it('sends openNow only when true', () => {
    expect(placesQueryParams({ openNow: true }).openNow).toBe(true);
    expect(placesQueryParams({ openNow: false }).openNow).toBeUndefined();
  });

  it('passes near-me + pagination params through', () => {
    const p = placesQueryParams({ lat: 13.7, lng: 100.5, radius: 3000, limit: 20, offset: 40 });
    expect(p).toMatchObject({ lat: 13.7, lng: 100.5, radius: 3000, limit: 20, offset: 40 });
  });
});
