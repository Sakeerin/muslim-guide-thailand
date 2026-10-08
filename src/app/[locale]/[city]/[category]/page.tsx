import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getCityBySlug, listPlaces } from '@/server/services/places';
import { resolveI18n } from '@/lib/i18n-content';
import { alternatesFor } from '@/lib/seo';
import { PlaceCard } from '@/components/place-card';

export const dynamic = 'force-dynamic';

/** City × type — the first programmatic SEO layer. */
const SEGMENT_TO_TYPE: Record<
  string,
  { type: 'restaurant' | 'mosque' | 'prayer_room' | 'attraction'; titleKey: string }
> = {
  'halal-restaurants': { type: 'restaurant', titleKey: 'categoryTitleRestaurant' },
  mosques: { type: 'mosque', titleKey: 'categoryTitleMosque' },
  'prayer-rooms': { type: 'prayer_room', titleKey: 'categoryTitlePrayerRoom' },
  attractions: { type: 'attraction', titleKey: 'categoryTitleAttraction' },
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
  const t = await getTranslations({ locale, namespace: 'place' });
  const cityName = resolveI18n(city.name as never, locale);
  return {
    title: t(mapping.titleKey, { city: cityName }),
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
  const t = await getTranslations({ locale, namespace: 'place' });

  const mapping = SEGMENT_TO_TYPE[category];
  if (!mapping) notFound();

  const city = await getCityBySlug(citySlug);
  if (!city || !city.isActive) notFound();

  const cityName = resolveI18n(city.name as never, locale);

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
        {t(mapping.titleKey, { city: cityName })}
      </h1>

      {items.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((place) => (
            <PlaceCard key={place.id} place={place} />
          ))}
        </div>
      ) : (
        <p className="rounded-xl border p-6 text-center opacity-70">
          {t('categoryEmpty')}
        </p>
      )}
    </main>
  );
}
