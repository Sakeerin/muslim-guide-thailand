import { asc, eq, sql } from 'drizzle-orm';
import { db } from '@/server/db/client';
import {
  amenities,
  categories,
  cities,
  placeCategories,
  places,
} from '@/server/db/schema';

/** Full place row for the admin edit form (includes lat/lng + category slugs). */
export async function getPlaceForEdit(id: string) {
  const rows = await db
    .select({
      id: places.id,
      type: places.type,
      slug: places.slug,
      name: places.name,
      description: places.description,
      address: places.address,
      cityId: places.cityId,
      citySlug: cities.slug,
      districtId: places.districtId,
      lat: sql<number>`ST_Y(${places.geog}::geometry)`,
      lng: sql<number>`ST_X(${places.geog}::geometry)`,
      phone: places.phone,
      website: places.website,
      lineId: places.lineId,
      googleMapsUrl: places.googleMapsUrl,
      openingHours: places.openingHours,
      priceRange: places.priceRange,
      halalStatus: places.halalStatus,
      halalSource: places.halalSource,
      servesAlcohol: places.servesAlcohol,
      attributes: places.attributes,
      status: places.status,
      createdBy: places.createdBy,
    })
    .from(places)
    .leftJoin(cities, eq(cities.id, places.cityId))
    .where(eq(places.id, id))
    .limit(1);

  const place = rows[0];
  if (!place) return null;

  const cats = await db
    .select({ slug: categories.slug })
    .from(placeCategories)
    .innerJoin(categories, eq(categories.id, placeCategories.categoryId))
    .where(eq(placeCategories.placeId, id));

  return { ...place, categorySlugs: cats.map((c) => c.slug) };
}

/** Reference data the form needs (cities, categories per type, amenities). */
export async function getFormOptions() {
  const [cityRows, categoryRows, amenityRows] = await Promise.all([
    db
      .select({ slug: cities.slug, name: cities.name })
      .from(cities)
      .orderBy(asc(cities.sortOrder)),
    db
      .select({ slug: categories.slug, name: categories.name, placeType: categories.placeType })
      .from(categories)
      .orderBy(asc(categories.sortOrder)),
    db
      .select({ key: amenities.key, name: amenities.name, appliesTo: amenities.appliesTo })
      .from(amenities)
      .orderBy(asc(amenities.sortOrder)),
  ]);
  return { cities: cityRows, categories: categoryRows, amenities: amenityRows };
}
