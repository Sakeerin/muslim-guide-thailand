import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { getCityBySlug, listPlaces } from '@/server/services/places';
import { resolveI18n } from '@/lib/i18n-content';
import { alternatesFor } from '@/lib/seo';
import { PlaceCard } from '@/components/place-card';

export const dynamic = 'force-dynamic';

const CITY_SECTIONS = [
  { segment: 'halal-restaurants', type: 'restaurant' as const, nameKey: 'sectionRestaurants' },
  { segment: 'mosques', type: 'mosque' as const, nameKey: 'sectionMosques' },
  { segment: 'prayer-rooms', type: 'prayer_room' as const, nameKey: 'sectionPrayerRooms' },
  { segment: 'attractions', type: 'attraction' as const, nameKey: 'sectionAttractions' },
];

const SECTION_LABELS: Record<string, Record<string, string>> = {
  sectionRestaurants: {
    th: 'ร้านอาหารฮาลาล', en: 'Halal restaurants', ms: 'Restoran halal', id: 'Restoran halal', ar: 'مطاعم حلال',
  },
  sectionMosques: {
    th: 'มัสยิด', en: 'Mosques', ms: 'Masjid', id: 'Masjid', ar: 'مساجد',
  },
  sectionPrayerRooms: {
    th: 'ห้องละหมาด', en: 'Prayer rooms', ms: 'Surau', id: 'Musala', ar: 'مصليات',
  },
  sectionAttractions: {
    th: 'ที่เที่ยว', en: 'Attractions', ms: 'Tarikan', id: 'Tempat wisata', ar: 'معالم سياحية',
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; city: string }>;
}): Promise<Metadata> {
  const { locale, city: citySlug } = await params;
  const city = await getCityBySlug(citySlug);
  if (!city) return {};
  const t = await getTranslations({ locale, namespace: 'common' });
  const cityName = resolveI18n(city.name as never, locale);
  return {
    title: `${cityName}`,
    description: `${t('tagline')} — ${cityName}`,
    alternates: alternatesFor(`/${citySlug}`),
  };
}

export default async function CityPage({
  params,
}: {
  params: Promise<{ locale: string; city: string }>;
}) {
  const { locale, city: citySlug } = await params;
  setRequestLocale(locale);

  const city = await getCityBySlug(citySlug);
  if (!city || !city.isActive) notFound();

  const cityName = resolveI18n(city.name as never, locale);

  const sections = await Promise.all(
    CITY_SECTIONS.map(async (s) => ({
      ...s,
      places: (
        await listPlaces({
          city: citySlug,
          type: s.type,
          radius: 3000,
          limit: 6,
          offset: 0,
        })
      ).items,
    })),
  );

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-4 py-10">
      <h1 className="text-3xl font-bold">{cityName}</h1>

      {sections.map((section) => {
        const label = SECTION_LABELS[section.nameKey][locale] ?? SECTION_LABELS[section.nameKey].en;
        if (section.places.length === 0) return null;
        return (
          <section key={section.segment}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">{label}</h2>
              <Link href={`/${citySlug}/${section.segment}`} className="text-sm underline">
                {label} →
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {section.places.map((place) => (
                <PlaceCard key={place.id} place={place} />
              ))}
            </div>
          </section>
        );
      })}

      {sections.every((s) => s.places.length === 0) && (
        <p className="rounded-xl border p-6 text-center opacity-70">
          {/* honest empty state — data collection in progress */}
          {locale === 'th'
            ? 'เรากำลังเก็บข้อมูลเมืองนี้อยู่ — กลับมาดูอีกครั้งเร็วๆ นี้'
            : 'We are still collecting data for this city — check back soon'}
        </p>
      )}
    </main>
  );
}
