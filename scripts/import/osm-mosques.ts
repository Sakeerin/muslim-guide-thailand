import 'dotenv/config';
import { ingestRecords, type IngestRecord } from '../../src/server/services/imports';
import { CITIES } from '../seed/data/cities';

/**
 * Ingest mosques from OpenStreetMap (Overpass) into the import STAGING table.
 * Nothing goes public here — staff review + promote/merge/reject in
 * /admin/import. ODbL attribution is attached to every record.
 * Usage: pnpm import:osm-mosques [--radius-km 40] [--city bangkok]
 */
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const USER_AGENT = 'muslim-guide-thai/0.1 (data bootstrap; contact: admin@localhost)';
const ATTRIBUTION = '© OpenStreetMap contributors (ODbL)';

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
  return ((await res.json()) as { elements: OverpassElement[] }).elements;
}

function coordsOf(el: OverpassElement): { lat: number; lng: number } | null {
  if (el.lat !== undefined && el.lon !== undefined) return { lat: el.lat, lng: el.lon };
  if (el.center) return { lat: el.center.lat, lng: el.center.lon };
  return null;
}

async function main() {
  const radiusKm = Number(argValue('--radius-km') ?? 40);
  const onlyCity = argValue('--city');
  const targets = onlyCity ? CITIES.filter((c) => c.slug === onlyCity) : CITIES;
  if (targets.length === 0) throw new Error(`Unknown city: ${onlyCity}`);

  let total = 0;
  for (const city of targets) {
    console.log(`\n[${city.slug}] Overpass query (radius ${radiusKm} km)...`);
    const elements = await queryOverpass(city.lat, city.lng, radiusKm * 1000);

    const records: IngestRecord[] = [];
    for (const el of elements) {
      const coords = coordsOf(el);
      if (!coords || !el.tags) continue;
      const nameTh = el.tags['name:th'] ?? el.tags.name;
      const nameEn = el.tags['name:en'];
      const nameAr = el.tags['name:ar'];
      if (!nameTh && !nameEn) continue; // unnamed node — not useful
      records.push({
        source: 'osm',
        sourceRef: `${el.type}/${el.id}`,
        placeType: 'mosque',
        name: {
          ...(nameTh ? { th: nameTh } : {}),
          ...(nameEn ? { en: nameEn } : {}),
          ...(nameAr ? { ar: nameAr } : {}),
        },
        lat: coords.lat,
        lng: coords.lng,
        raw: el.tags,
        attribution: ATTRIBUTION,
      });
    }

    const n = await ingestRecords(records);
    total += n;
    console.log(`[${city.slug}] staged ${n} mosque record(s)`);
    await new Promise((r) => setTimeout(r, 3000)); // be polite to public Overpass
  }

  console.log(`\nStaged ${total} record(s) → review at /admin/import`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
