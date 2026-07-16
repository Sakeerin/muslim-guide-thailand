import type { MetadataRoute } from 'next';
import { inArray } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { cities, places } from '@/server/db/schema';
import { locales } from '@/i18n/routing';
import { SITE_URL } from '@/lib/seo';

// Dynamic sitemap cached at build; refresh hourly so new places appear.
export const revalidate = 3600;

/** hreflang alternates map for a locale-less path (must start with '/' or be ''). */
function langAlternates(path: string): Record<string, string> {
  return Object.fromEntries(locales.map((l) => [l, `${SITE_URL}/${l}${path}`]));
}

function entry(
  path: string,
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'],
  priority: number,
  lastModified?: Date,
): MetadataRoute.Sitemap[number] {
  return {
    url: `${SITE_URL}/en${path}`,
    lastModified: lastModified ?? new Date(),
    changeFrequency,
    priority,
    alternates: { languages: langAlternates(path) },
  };
}

const CITY_SECTIONS = ['halal-restaurants', 'mosques', 'prayer-rooms', 'attractions'];
const STATIC_PATHS: Array<[string, number]> = [
  ['', 1],
  ['/prayer-times', 0.7],
  ['/qibla', 0.6],
  ['/islamic-calendar', 0.6],
  ['/map', 0.6],
  ['/how-we-verify', 0.5],
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [cityRows, placeRows] = await Promise.all([
    db.select({ slug: cities.slug }).from(cities),
    db
      .select({ slug: places.slug, updatedAt: places.updatedAt })
      .from(places)
      .where(inArray(places.status, ['published', 'published_unverified'])),
  ]);

  const out: MetadataRoute.Sitemap = [];

  for (const [path, priority] of STATIC_PATHS) {
    out.push(entry(path, path === '' ? 'daily' : 'weekly', priority));
  }

  for (const city of cityRows) {
    out.push(entry(`/${city.slug}`, 'weekly', 0.8));
    for (const section of CITY_SECTIONS) {
      out.push(entry(`/${city.slug}/${section}`, 'weekly', 0.7));
    }
    out.push(entry(`/prayer-times/${city.slug}`, 'monthly', 0.6));
  }

  for (const p of placeRows) {
    out.push(entry(`/place/${p.slug}`, 'weekly', 0.8, p.updatedAt ?? undefined));
  }

  return out;
}
