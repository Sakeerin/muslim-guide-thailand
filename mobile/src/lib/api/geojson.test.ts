import { describe, expect, it } from 'vitest';
import { geoJsonQueryParams } from './geojson';

describe('geoJsonQueryParams', () => {
  it('always sends the locale', () => {
    expect(geoJsonQueryParams({ locale: 'th' })).toMatchObject({ locale: 'th' });
  });

  it('omits type when unset', () => {
    expect(geoJsonQueryParams({ locale: 'en' }).type).toBeUndefined();
  });

  it('passes an allowed type through', () => {
    expect(geoJsonQueryParams({ locale: 'en', type: 'mosque' }).type).toBe('mosque');
  });

  it('joins bbox as w,s,e,n', () => {
    expect(geoJsonQueryParams({ locale: 'en', bbox: [100, 13, 101, 14] }).bbox).toBe('100,13,101,14');
  });

  it('omits bbox when unset', () => {
    expect(geoJsonQueryParams({ locale: 'en' }).bbox).toBeUndefined();
  });
});
