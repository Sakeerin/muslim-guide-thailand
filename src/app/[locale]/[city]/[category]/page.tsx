import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { getCityBySlug, listPlaces } from '@/server/services/places';
import { resolveI18n } from '@/lib/i18n-content';
import { alternatesFor } from '@/lib/seo';
import { PlaceCard } from '@/components/place-card';

export const dynamic = 'force-dynamic';

/** City × type — the first programmatic SEO layer. */
const SEGMENT_TO_TYPE: Record<
  string,
  { type: 'restaurant' | 'mosque' | 'prayer_room' | 'attraction'; label: Record<string, string> }
> = {
  'halal-restaurants': {
    type: 'restaurant',
    label: { th: 'ร้านอาหารฮาลาลใน', en: 'Halal restaurants in', ms: 'Restoran halal di', id: 'Restoran halal di', ar: 'مطاعم حلال في' },
  },
  mosques: {
    type: 'mosque',
    label: { th: 'มัสยิดใน', en: 'Mosques in', ms: 'Masjid di', id: 'Masjid di', ar: 'مساجد في' },
  },
  'prayer-rooms': {
    type: 'prayer_room',
    label: { th: 'ห้องละหมาดใน', en: 'Prayer rooms in', ms: 'Surau di', id: 'Musala di', ar: 'مصليات في' },
  },
  attractions: {
    type: 'attraction',
    label: { th: 'ที่เที่ยวใน', en: 'Attractions in', ms: 'Tarikan di', id: 'Tempat wisata di', ar: 'معالم في' },
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; city: string; category: string }>;
}): Promise<Metadata> {
  const { locale, city: citySlug, category } = await params;
  const mapping = SEGMENT_TO_TYPE[category];
  const city = await getCityBySlug(citySlug);
  if (!mapping || !city) return {};
  const cityName = resolveI18n(city.name as never, locale);
  const label = mapping.label[locale] ?? mapping.label.en;
  return {
    title: `${label} ${cityName}`,
    alternates: alternatesFor(`/${citySlug}/${category}`),
  };
}

export default async function CityCategoryPage({
  params,
}: {
  params: Promise<{ locale: string; city: string; category: string }>;
}) {
  const { locale, city: citySlug, category } = await params;
  setRequestLocale(locale);

  const mapping = SEGMENT_TO_TYPE[category];
  if (!mapping) notFound();

  const city = await getCityBySlug(citySlug);
  if (!city || !city.isActive) notFound();

  const cityName = resolveI18n(city.name as never, locale);
  const label = mapping.label[locale] ?? mapping.label.en;

  const { items } = await listPlaces({
    city: citySlug,
    type: mapping.type,
    radius: 3000,
    limit: 50,
    offset: 0,
  });

  // thin-content guard: <3 items → noindex (rule from the product spec)
  const noindex = items.length < 3;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-10">
      {noindex && <meta name="robots" content="noindex" />}
      <h1 className="text-2xl font-bold sm:text-3xl">
        {label} {cityName}
      </h1>

      {items.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((place) => (
            <PlaceCard key={place.id} place={place} />
          ))}
        </div>
      ) : (
        <p className="rounded-xl border p-6 text-center opacity-70">
          {locale === 'th'
            ? 'เรากำลังเก็บข้อมูลหมวดนี้อยู่ — กลับมาดูอีกครั้งเร็วๆ นี้'
            : 'We are still collecting data for this category — check back soon'}
        </p>
      )}
    </main>
  );
}
