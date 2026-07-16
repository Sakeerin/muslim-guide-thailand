import { and, asc, eq, inArray, sql, type SQL } from 'drizzle-orm';
import { db } from '@/server/db/client';
import {
  cities,
  districts,
  places,
  placeCategories,
  categories,
  halalCertifications,
} from '@/server/db/schema';
import type { ListPlacesQuery, UpsertPlaceInput } from '@/lib/validators/place';
import { openStatusAt } from '@/lib/opening-hours';

/** Public listings: only these statuses are ever exposed. */
const PUBLIC_STATUSES = ['published', 'published_unverified'] as const;

const publicStatusFilter = () => inArray(places.status, [...PUBLIC_STATUSES]);

const geogPoint = (lng: number, lat: number) =>
  sql`ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography`;

const latColumn = sql<number>`ST_Y(${places.geog}::geometry)`.as('lat');
const lngColumn = sql<number>`ST_X(${places.geog}::geometry)`.as('lng');

export interface PlaceListItem {
  id: string;
  slug: string;
  type: string;
  name: Record<string, string>;
  address: Record<string, string>;
  halalStatus: string;
  halalSource: string;
  servesAlcohol: boolean | null;
  priceRange: number | null;
  openingHours: unknown;
  lastVerifiedAt: Date | null;
  disputed: boolean;
  status: string;
  lat: number;
  lng: number;
  distanceM?: number;
  openNow?: boolean | null;
}

function baseSelection() {
  return {
    id: places.id,
    slug: places.slug,
    type: places.type,
    name: places.name,
    address: places.address,
    halalStatus: places.halalStatus,
    halalSource: places.halalSource,
    servesAlcohol: places.servesAlcohol,
    priceRange: places.priceRange,
    openingHours: places.openingHours,
    lastVerifiedAt: places.lastVerifiedAt,
    disputed: places.disputed,
    status: places.status,
    lat: latColumn,
    lng: lngColumn,
  };
}

function decorateOpenNow<T extends { openingHours: unknown }>(
  rows: T[],
  now = new Date(),
): (T & { openNow: boolean | null })[] {
  return rows.map((row) => {
    const status = openStatusAt(row.openingHours as never, now);
    return { ...row, openNow: status.known ? status.open : null };
  });
}

export async function listPlaces(query: ListPlacesQuery) {
  const conditions: SQL[] = [publicStatusFilter()];

  if (query.city) {
    const city = await db.query.cities.findFirst({ where: eq(cities.slug, query.city) });
    if (!city) return { items: [], total: 0 };
    conditions.push(eq(places.cityId, city.id));
  }
  if (query.type) conditions.push(eq(places.type, query.type));
  if (query.halal?.length) conditions.push(inArray(places.halalStatus, query.halal));

  if (query.category) {
    conditions.push(
      sql`${places.id} IN (
        SELECT pc.place_id FROM place_categories pc
        JOIN categories c ON c.id = pc.category_id
        WHERE c.slug = ${query.category}
      )`,
    );
  }

  if (query.q) {
    // pg_trgm partial match on th/en names; ILIKE catches short queries
    // where trigram similarity is unreliable.
    const q = query.q;
    conditions.push(
      sql`(
        ${places.name}->>'th' ILIKE ${'%' + q + '%'}
        OR ${places.name}->>'en' ILIKE ${'%' + q + '%'}
        OR similarity(${places.name}->>'th', ${q}) > 0.25
        OR similarity(${places.name}->>'en', ${q}) > 0.25
      )`,
    );
  }

  const hasGeo = query.lat !== undefined && query.lng !== undefined;
  const point = hasGeo ? geogPoint(query.lng!, query.lat!) : null;
  if (point) {
    conditions.push(sql`ST_DWithin(${places.geog}, ${point}, ${query.radius})`);
  }

  const selection = point
    ? { ...baseSelection(), distanceM: sql<number>`ST_Distance(${places.geog}, ${point})`.as('distance_m') }
    : baseSelection();

  const orderBy = point
    ? sql`${places.geog} <-> ${point}` // KNN, GiST-accelerated
    : asc(places.slug);

  const rows = await db
    .select(selection)
    .from(places)
    .where(and(...conditions))
    .orderBy(orderBy)
    .limit(query.limit)
    .offset(query.offset);

  let items = decorateOpenNow(rows) as PlaceListItem[];
  if (query.openNow) items = items.filter((i) => i.openNow === true);

  return { items, total: items.length + query.offset };
}

export async function getPlaceBySlug(slug: string) {
  const rows = await db
    .select({
      ...baseSelection(),
      description: places.description,
      attributes: places.attributes,
      phone: places.phone,
      website: places.website,
      lineId: places.lineId,
      googleMapsUrl: places.googleMapsUrl,
      dataSource: places.dataSource,
      sourceRef: places.sourceRef,
      cityId: places.cityId,
      districtId: places.districtId,
      avgRating: places.avgRating,
      reviewCount: places.reviewCount,
    })
    .from(places)
    .where(and(eq(places.slug, slug), publicStatusFilter()))
    .limit(1);

  const place = rows[0];
  if (!place) return null;

  const [cityRow, districtRow, placeCats, certs] = await Promise.all([
    place.cityId
      ? db.query.cities.findFirst({ where: eq(cities.id, place.cityId) })
      : Promise.resolve(null),
    place.districtId
      ? db.query.districts.findFirst({ where: eq(districts.id, place.districtId) })
      : Promise.resolve(null),
    db
      .select({ slug: categories.slug, name: categories.name })
      .from(placeCategories)
      .innerJoin(categories, eq(categories.id, placeCategories.categoryId))
      .where(eq(placeCategories.placeId, place.id)),
    // Only verified certificates are ever shown publicly (s.272-273 safety)
    db
      .select({
        certifyingBody: halalCertifications.certifyingBody,
        certNumber: halalCertifications.certNumber,
        issuedAt: halalCertifications.issuedAt,
        expiresAt: halalCertifications.expiresAt,
        status: halalCertifications.status,
        verifiedAt: halalCertifications.verifiedAt,
      })
      .from(halalCertifications)
      .where(
        and(
          eq(halalCertifications.placeId, place.id),
          inArray(halalCertifications.status, ['verified', 'expired']),
        ),
      ),
  ]);

  const [decorated] = decorateOpenNow([place]);
  return {
    ...decorated,
    city: cityRow ? { slug: cityRow.slug, name: cityRow.name, provinceCode: cityRow.provinceCode } : null,
    district: districtRow ? { slug: districtRow.slug, name: districtRow.name } : null,
    categories: placeCats,
    certifications: certs,
  };
}

export type PlaceDetail = NonNullable<Awaited<ReturnType<typeof getPlaceBySlug>>>;

/**
 * Mosques + prayer rooms nearest to a point — the "pray near here" block
 * shown on every listing page (signature feature).
 */
export async function prayerPlacesNearby(lat: number, lng: number, limit = 3) {
  const point = geogPoint(lng, lat);
  const rows = await db
    .select({
      ...baseSelection(),
      distanceM: sql<number>`ST_Distance(${places.geog}, ${point})`.as('distance_m'),
    })
    .from(places)
    .where(
      and(
        publicStatusFilter(),
        inArray(places.type, ['mosque', 'prayer_room']),
        sql`ST_DWithin(${places.geog}, ${point}, ${20_000})`,
      ),
    )
    .orderBy(sql`${places.geog} <-> ${point}`)
    .limit(limit);
  return rows as PlaceListItem[];
}

/** Other public places near a point, excluding one place (its own page). */
export async function nearbyPlaces(lat: number, lng: number, excludeId: string, limit = 6) {
  const point = geogPoint(lng, lat);
  const rows = await db
    .select({
      ...baseSelection(),
      distanceM: sql<number>`ST_Distance(${places.geog}, ${point})`.as('distance_m'),
    })
    .from(places)
    .where(
      and(
        publicStatusFilter(),
        sql`${places.id} <> ${excludeId}`,
        sql`ST_DWithin(${places.geog}, ${point}, ${5_000})`,
      ),
    )
    .orderBy(sql`${places.geog} <-> ${point}`)
    .limit(limit);
  return rows as PlaceListItem[];
}

/** Admin upsert. Caller is responsible for authorization + audit logging. */
export async function upsertPlace(input: UpsertPlaceInput, actorId: string, placeId?: string) {
  const city = input.citySlug
    ? await db.query.cities.findFirst({ where: eq(cities.slug, input.citySlug) })
    : null;
  if (input.citySlug && !city) throw new Error(`Unknown city: ${input.citySlug}`);

  const district = input.districtSlug
    ? await db.query.districts.findFirst({ where: eq(districts.slug, input.districtSlug) })
    : null;

  const values = {
    type: input.type,
    slug: input.slug,
    name: input.name,
    description: input.description ?? {},
    address: input.address ?? {},
    cityId: city?.id ?? null,
    districtId: district?.id ?? null,
    geog: geogPoint(input.lng, input.lat) as unknown as string,
    phone: input.phone ?? null,
    website: input.website ?? null,
    lineId: input.lineId ?? null,
    googleMapsUrl: input.googleMapsUrl ?? null,
    openingHours: input.openingHours ?? null,
    priceRange: input.priceRange ?? null,
    halalStatus: input.halalStatus,
    halalSource: input.halalSource,
    servesAlcohol: input.servesAlcohol ?? null,
    attributes: input.attributes,
    status: input.status,
    updatedAt: new Date(),
  };

  const [row] = placeId
    ? await db.update(places).set(values).where(eq(places.id, placeId)).returning({ id: places.id })
    : await db
        .insert(places)
        .values({ ...values, createdBy: actorId })
        .returning({ id: places.id });

  // replace category links
  if (input.categorySlugs) {
    await db.delete(placeCategories).where(eq(placeCategories.placeId, row.id));
    if (input.categorySlugs.length) {
      const cats = await db
        .select({ id: categories.id })
        .from(categories)
        .where(inArray(categories.slug, input.categorySlugs));
      if (cats.length) {
        await db
          .insert(placeCategories)
          .values(cats.map((c) => ({ placeId: row.id, categoryId: c.id })));
      }
    }
  }

  return row.id;
}

export interface PlaceGeoFeature {
  type: 'Feature';
  geometry: { type: 'Point'; coordinates: [number, number] };
  properties: { slug: string; name: string; type: string; halalStatus: string };
}

/**
 * Published places as a GeoJSON FeatureCollection for the map (clustered
 * client-side by MapLibre). Optional bounding box [w,s,e,n]; name resolved
 * to the requested locale for label display.
 */
export async function placesGeoJson(
  locale: string,
  bbox?: [number, number, number, number],
  type?: string,
) {
  const conditions: SQL[] = [publicStatusFilter()];
  if (type) conditions.push(eq(places.type, type as never));
  if (bbox) {
    const [w, s, e, n] = bbox;
    conditions.push(
      sql`ST_Intersects(${places.geog}, ST_MakeEnvelope(${w}, ${s}, ${e}, ${n}, 4326)::geography)`,
    );
  }

  const rows = await db
    .select({
      slug: places.slug,
      name: places.name,
      type: places.type,
      halalStatus: places.halalStatus,
      lat: latColumn,
      lng: lngColumn,
    })
    .from(places)
    .where(and(...conditions))
    .limit(5000);

  const features: PlaceGeoFeature[] = rows.map((r) => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [Number(r.lng), Number(r.lat)] },
    properties: {
      slug: r.slug,
      name: resolveI18nName(r.name as Record<string, string>, locale),
      type: r.type,
      halalStatus: r.halalStatus,
    },
  }));

  return { type: 'FeatureCollection' as const, features };
}

function resolveI18nName(name: Record<string, string>, locale: string): string {
  return name[locale] ?? name.en ?? name.th ?? Object.values(name)[0] ?? '';
}

export async function listCities() {
  return db
    .select({
      id: cities.id,
      slug: cities.slug,
      name: cities.name,
      provinceCode: cities.provinceCode,
      sortOrder: cities.sortOrder,
    })
    .from(cities)
    .where(eq(cities.isActive, true))
    .orderBy(asc(cities.sortOrder));
}

export async function getCityBySlug(slug: string) {
  return db.query.cities.findFirst({ where: eq(cities.slug, slug) });
}
