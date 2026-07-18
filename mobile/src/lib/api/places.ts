import type {
  HalalStatus,
  PlaceDetailResponse,
  PlacesListResponse,
  PlaceType,
} from '@/types/api';
import { apiFetch, type Query } from './client';

export interface PlacesQuery {
  city?: string;
  type?: PlaceType;
  category?: string;
  halal?: HalalStatus[];
  q?: string;
  /** near-me: supply BOTH lat & lng to get distance-sorted results + distanceM */
  lat?: number;
  lng?: number;
  radius?: number;
  openNow?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Map a typed query to the wire params the server expects. Pure — unit-tested.
 * - `halal` becomes a comma-joined string (server splits it back)
 * - `openNow` is sent only when true (server filters only on ?openNow=true)
 */
export function placesQueryParams(q: PlacesQuery): Query {
  return {
    city: q.city,
    type: q.type,
    category: q.category,
    halal: q.halal && q.halal.length > 0 ? q.halal.join(',') : undefined,
    q: q.q,
    lat: q.lat,
    lng: q.lng,
    radius: q.radius,
    openNow: q.openNow ? true : undefined,
    limit: q.limit,
    offset: q.offset,
  };
}

export function getPlaces(q: PlacesQuery = {}, signal?: AbortSignal): Promise<PlacesListResponse> {
  return apiFetch<PlacesListResponse>('/api/v1/places', { query: placesQueryParams(q), signal });
}

export function getPlace(slug: string, signal?: AbortSignal): Promise<PlaceDetailResponse> {
  return apiFetch<PlaceDetailResponse>(`/api/v1/places/${encodeURIComponent(slug)}`, { signal });
}
