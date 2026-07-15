import 'dotenv/config';
import { eq, sql } from 'drizzle-orm';
import { db } from '../../src/server/db/client';
import { cities, places } from '../../src/server/db/schema';
import { CITIES } from '../seed/data/cities';

/**
 * One-off mosque seed from OpenStreetMap via Overpass API.
 * - Imported rows: status=published_unverified, halal L4 (unverified),
 *   data_source='osm', source_ref='node/…' — ODbL attribution is rendered
 *   in the site footer and per-listing data-source line.
 * - Idempotent: skips elements whose source_ref already exists, and skips
 *   anything within 75 m of an existing mosque (cross-source dedupe).
 * Usage: pnpm import:osm-mosques [--radius-km 40] [--city bangkok]
 */

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const USER_AGENT = 'muslim-guide-thai/0.1 (data bootstrap; contact: admin@localhost)';

interface OverpassElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

function argValue(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  return idx >= 0 ? process.argv[idx + 1] : undefined;
}

async function queryOverpass(lat: number, lng: number, radiusM: number): Promise<OverpassElement[]> {
  const query = `
    [out:json][timeout:60];
    nwr["amenity"="place_of_worship"]["religion"="muslim"](around:${radiusM},${lat},${lng});
    out center tags;
  `;
  const res = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': USER_AGENT },
    body: `data=${encodeURIComponent(query)}`,
  });
  if (!res.ok) throw new Error(`Overpass ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as { elements: OverpassElement[] };
  return json.elements;
}

function coordsOf(el: OverpassElement): { lat: number; lng: number } | null {
  if (el.lat !== undefined && el.lon !== undefined) return { lat: el.lat, lng: el.lon };
  if (el.center) return { lat: el.center.lat, lng: el.center.lon };
  return null;
}

async function importCity(citySlug: string, radiusKm: number) {
  const seed = CITIES.find((c) => c.slug === citySlug);
  if (!seed) throw new Error(`Unknown city: ${citySlug}`);
  const city = await db.query.cities.findFirst({ where: eq(cities.slug, citySlug) });
  if (!city) throw new Error(`City not in DB (run pnpm db:seed first): ${citySlug}`);

  console.log(`\n[${citySlug}] querying Overpass (radius ${radiusKm} km)...`);
  const elements = await queryOverpass(seed.lat, seed.lng, radiusKm * 1000);
  console.log(`[${citySlug}] ${elements.length} elements returned`);

  let inserted = 0;
  let skipped = 0;

  for (const el of elements) {
    const coords = coordsOf(el);
    if (!coords || !el.tags) {
      skipped++;
      continue;
    }
    const sourceRef = `${el.type}/${el.id}`;

    // already imported?
    const existingByRef = await db.query.places.findFirst({
      where: eq(places.sourceRef, sourceRef),
    });
    if (existingByRef) {
      skipped++;
      continue;
    }

    // near-duplicate from another source?
    const nearby = await db
      .select({ id: places.id })
      .from(places)
      .where(
        sql`${places.type} = 'mosque' AND ST_DWithin(${places.geog}, ST_SetSRID(ST_MakePoint(${coords.lng}, ${coords.lat}), 4326)::geography, 75)`,
      )
      .limit(1);
    if (nearby.length > 0) {
      skipped++;
      continue;
    }

    const nameTh = el.tags['name:th'] ?? el.tags.name;
    const nameEn = el.tags['name:en'];
    const nameAr = el.tags['name:ar'];
    if (!nameTh && !nameEn) {
      skipped++; // unnamed node — not useful as a listing
      continue;
    }

    await db.insert(places).values({
      type: 'mosque',
      slug: `osm-mosque-${el.type}-${el.id}`,
      name: {
        ...(nameTh ? { th: nameTh } : {}),
        ...(nameEn ? { en: nameEn } : {}),
        ...(nameAr ? { ar: nameAr } : {}),
      },
      address: {},
      cityId: city.id,
      geog: sql`ST_SetSRID(ST_MakePoint(${coords.lng}, ${coords.lat}), 4326)::geography` as unknown as string,
      halalStatus: 'unverified',
      halalSource: 'none',
      attributes: {},
      status: 'published_unverified',
      dataSource: 'osm',
      sourceRef,
    });
    inserted++;
  }

  console.log(`[${citySlug}] inserted ${inserted}, skipped ${skipped}`);
}

async function main() {
  const radiusKm = Number(argValue('--radius-km') ?? 40);
  const onlyCity = argValue('--city');
  const targets = onlyCity ? [onlyCity] : CITIES.map((c) => c.slug);

  for (const slug of targets) {
    await importCity(slug, radiusKm);
    // be polite to the public Overpass instance
    await new Promise((r) => setTimeout(r, 3000));
  }

  console.log('\nOSM mosque import complete. All rows are published_unverified (L4).');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
