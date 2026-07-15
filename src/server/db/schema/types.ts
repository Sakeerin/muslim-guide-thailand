import { customType } from 'drizzle-orm/pg-core';

/**
 * PostGIS geography(Point,4326).
 * Values are read as GeoJSON text via ST_AsGeoJSON in queries that need
 * coordinates; inserts/updates go through sql`ST_SetSRID(ST_MakePoint(lng,lat),4326)::geography`.
 */
export const geographyPoint = customType<{ data: string }>({
  dataType() {
    return 'geography(Point,4326)';
  },
});

/** Localized string per supported locale. At least th or en must be present. */
export type I18nText = Partial<Record<'th' | 'en' | 'ms' | 'id' | 'ar', string>>;

/** Per-locale machine-translation state, e.g. {"en":{"mt":true,"reviewed":false}} */
export type TranslationMeta = Partial<
  Record<'th' | 'en' | 'ms' | 'id' | 'ar', { mt: boolean; reviewed: boolean }>
>;

/** Weekly opening hours: {"mon":[["07:00","21:00"]], ...} — empty array = closed */
export type OpeningHours = Partial<
  Record<'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun', [string, string][]>
>;
