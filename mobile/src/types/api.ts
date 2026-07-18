/**
 * Types mirroring the web project's /api/v1 JSON contract.
 *
 * These are re-declared here (not imported from ../src) on purpose: the web
 * types pull in server-only runtime code (drizzle customType), which must never
 * enter the React Native bundle. Kept in sync by hand against
 *   src/server/services/places.ts, src/server/services/prayer-times.ts,
 *   src/lib/validators/place.ts, src/lib/api.ts
 */

/** Localized string per supported locale (JSONB i18n field). */
export type I18nText = Partial<Record<'th' | 'en' | 'ms' | 'id' | 'ar', string>>;

/** Weekly opening hours: {"mon":[["07:00","21:00"]], ...} — [] = closed. */
export type OpeningHours = Partial<
  Record<'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun', [string, string][]>
>;

export type HalalStatus =
  | 'cicot_certified'
  | 'muslim_owned'
  | 'muslim_friendly'
  | 'unverified';

export type PlaceType =
  | 'restaurant'
  | 'mosque'
  | 'prayer_room'
  | 'hotel'
  | 'attraction'
  | 'shop'
  | 'other';

/** Standard /api/v1 envelope. `data` is null on error, `error` is null on success. */
export interface ApiEnvelope<T> {
  data: T | null;
  error: { code: string; message: string; details?: unknown } | null;
}

/** One row from GET /api/v1/places (Date fields arrive as ISO strings over JSON). */
export interface PlaceListItem {
  id: string;
  slug: string;
  type: string;
  name: I18nText;
  address: I18nText;
  halalStatus: string;
  halalSource: string;
  servesAlcohol: boolean | null;
  priceRange: number | null;
  openingHours: OpeningHours | null;
  lastVerifiedAt: string | null;
  disputed: boolean;
  status: string;
  lat: number;
  lng: number;
  featuredUntil?: string | null;
  featured?: boolean;
  /** present only for near-me queries (lat & lng supplied) */
  distanceM?: number;
  /** true / false / null (unknown opening hours) */
  openNow?: boolean | null;
}

export interface PlacesListResponse {
  items: PlaceListItem[];
  /** NOTE: a pagination hint (items.length + offset), NOT an absolute count. */
  total: number;
}

export interface HalalCertification {
  certifyingBody: string;
  certNumber: string | null;
  issuedAt: string | null;
  expiresAt: string | null;
  status: string;
  verifiedAt: string | null;
}

export interface PlaceDetail extends PlaceListItem {
  description: I18nText | null;
  attributes: Record<string, unknown> | null;
  phone: string | null;
  website: string | null;
  lineId: string | null;
  googleMapsUrl: string | null;
  dataSource: string | null;
  ownerUserId: string | null;
  avgRating: number | null;
  reviewCount: number | null;
  city: { slug: string; name: I18nText; provinceCode: string } | null;
  district: { slug: string; name: I18nText } | null;
  categories: { slug: string; name: I18nText }[];
  certifications: HalalCertification[];
}

export interface PlaceDetailResponse {
  place: PlaceDetail;
  prayerNearby: PlaceListItem[];
}

export interface DayPrayerTimes {
  date: string; // YYYY-MM-DD
  imsak?: string | null;
  fajr: string;
  sunrise?: string | null;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
}

export interface PrayerTimesResponse {
  provinceCode: string;
  source: 'official' | 'calculated';
  sourceNote?: string;
  days: DayPrayerTimes[];
}

export interface PlaceReview {
  id: string;
  rating: number;
  body: string | null;
  lang: string | null;
  createdAt: string;
  authorName: string;
}

export interface PlaceReviewsResponse {
  reviews: PlaceReview[];
}

export interface CreateReviewResult {
  id: string;
  /** 'published' = live now; 'pending' = held for moderation */
  status: 'published' | 'pending';
}
