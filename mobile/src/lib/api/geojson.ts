import type { PlaceType } from '@/types/api';
import { buildUrl, type Query } from './client';

// The geojson route enum has no 'other' — sending it would 400.
export type GeoJsonPlaceType = Exclude<PlaceType, 'other'>;

export interface GeoJsonQuery {
  locale: string;
  type?: GeoJsonPlaceType;
  /** [west, south, east, north] */
  bbox?: [number, number, number, number];
}

export interface PlaceFeatureProps {
  slug: string;
  name: string;
  type: string;
  halalStatus: string;
}

export type PlaceFeatureCollection = GeoJSON.FeatureCollection<GeoJSON.Point, PlaceFeatureProps>;

/** Pure: map the typed query to wire params (bbox joined "w,s,e,n"). */
export function geoJsonQueryParams(q: GeoJsonQuery): Query {
  return {
    locale: q.locale,
    type: q.type,
    bbox: q.bbox ? q.bbox.join(',') : undefined,
  };
}

/**
 * GET /api/v1/places/geojson. This endpoint returns a RAW GeoJSON
 * FeatureCollection (not the {data,error} envelope), so it must NOT go through
 * apiFetch/unwrapEnvelope — those would throw on the missing envelope.
 */
export async function getPlacesGeoJson(
  q: GeoJsonQuery,
  signal?: AbortSignal,
): Promise<PlaceFeatureCollection> {
  const res = await fetch(buildUrl('/api/v1/places/geojson', geoJsonQueryParams(q)), {
    headers: { Accept: 'application/json' },
    signal,
  });
  if (!res.ok) throw new Error(`GeoJSON request failed (HTTP ${res.status})`);
  return (await res.json()) as PlaceFeatureCollection;
}
