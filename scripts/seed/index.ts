import 'dotenv/config';
import { eq, sql } from 'drizzle-orm';
import { db } from '../../src/server/db/client';
import {
  amenities,
  categories,
  cities,
  islamicEvents,
  placeCategories,
  places,
} from '../../src/server/db/schema';
import { CITIES } from './data/cities';
import { CATEGORIES } from './data/categories';
import { AMENITIES } from './data/amenities';
import { DEMO_PLACES } from './data/demo-places';
import { ISLAMIC_EVENTS_SAMPLE } from './data/islamic-events';

const geog = (lng: number, lat: number) =>
  sql`ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography`;

async function seedCities() {
  for (const c of CITIES) {
    await db
      .insert(cities)
      .values({
        slug: c.slug,
        name: c.name,
        provinceCode: c.provinceCode,
        center: geog(c.lng, c.lat) as unknown as string,
        sortOrder: c.sortOrder,
      })
      .onConflictDoUpdate({
        target: cities.slug,
        set: {
          name: c.name,
          provinceCode: c.provinceCode,
          center: geog(c.lng, c.lat) as unknown as string,
          sortOrder: c.sortOrder,
        },
      });
  }
  console.log(`Seeded ${CITIES.length} cities`);
}

async function seedCategories() {
  for (const c of CATEGORIES) {
    await db
      .insert(categories)
      .values({
        slug: c.slug,
        name: c.name,
        placeType: c.placeType,
        sortOrder: c.sortOrder,
      })
      .onConflictDoUpdate({
        target: categories.slug,
        set: { name: c.name, placeType: c.placeType, sortOrder: c.sortOrder },
      });
  }
  console.log(`Seeded ${CATEGORIES.length} categories`);
}

async function seedAmenities() {
  for (const a of AMENITIES) {
    await db
      .insert(amenities)
      .values({
        key: a.key,
        name: a.name,
        icon: a.icon,
        appliesTo: a.appliesTo,
        sortOrder: a.sortOrder,
      })
      .onConflictDoUpdate({
        target: amenities.key,
        set: { name: a.name, icon: a.icon, appliesTo: a.appliesTo, sortOrder: a.sortOrder },
      });
  }
  console.log(`Seeded ${AMENITIES.length} amenities`);
}

async function seedDemoPlaces() {
  for (const p of DEMO_PLACES) {
    const city = await db.query.cities.findFirst({ where: eq(cities.slug, p.citySlug) });
    if (!city) throw new Error(`City not found: ${p.citySlug}`);

    const values = {
      type: p.type,
      slug: p.slug,
      name: p.name,
      description: p.description ?? {},
      address: p.address ?? {},
      cityId: city.id,
      geog: geog(p.lng, p.lat) as unknown as string,
      openingHours: (p.openingHours ?? null) as never,
      priceRange: p.priceRange ?? null,
      halalStatus: p.halalStatus,
      halalSource: p.halalSource,
      servesAlcohol: p.servesAlcohol ?? null,
      attributes: p.attributes ?? {},
      status: p.status,
      dataSource: p.dataSource,
      sourceRef: p.sourceRef ?? null,
      lastVerifiedAt: p.dataSource === 'admin' ? new Date() : null,
      updatedAt: new Date(),
    };

    const [row] = await db
      .insert(places)
      .values(values)
      .onConflictDoUpdate({ target: places.slug, set: values })
      .returning({ id: places.id });

    await db.delete(placeCategories).where(eq(placeCategories.placeId, row.id));
    for (const slug of p.categorySlugs) {
      const cat = await db.query.categories.findFirst({ where: eq(categories.slug, slug) });
      if (cat) {
        await db.insert(placeCategories).values({ placeId: row.id, categoryId: cat.id });
      }
    }
  }
  console.log(`Seeded ${DEMO_PLACES.length} demo places`);
}

async function seedIslamicEvents() {
  for (const e of ISLAMIC_EVENTS_SAMPLE) {
    await db
      .insert(islamicEvents)
      .values(e)
      .onConflictDoUpdate({
        target: islamicEvents.key,
        set: { gdate: e.gdate, hijriDate: e.hijriDate, title: e.title, source: e.source },
      });
  }
  console.log(`Seeded ${ISLAMIC_EVENTS_SAMPLE.length} islamic events (SAMPLE)`);
}

async function main() {
  await seedCities();
  await seedCategories();
  await seedAmenities();
  await seedIslamicEvents();

  if (process.env.SEED_DEMO === '1') {
    await seedDemoPlaces();
  } else {
    console.log('Skipping demo places (set SEED_DEMO=1 to include)');
  }

  console.log('Seed complete.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
