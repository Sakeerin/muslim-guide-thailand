import type { Metadata } from 'next';
import { getLocale, getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { listCities } from '@/server/services/places';
import { resolveI18n } from '@/lib/i18n-content';
import { alternatesFor } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'prayer' });
  return { title: t('title'), alternates: alternatesFor('/prayer-times') };
}

export default async function PrayerTimesIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, currentLocale, cities] = await Promise.all([
    getTranslations('prayer'),
    getLocale(),
    listCities(),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10">
      <h1 className="text-3xl font-bold">{t('title')}</h1>
      <p className="opacity-70">{t('selectProvince')}</p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {cities.map((city) => (
          <Link
            key={city.slug}
            href={`/prayer-times/${city.slug}`}
            className="rounded-xl border p-4 text-center font-medium hover:bg-foreground/5"
          >
            {resolveI18n(city.name as never, currentLocale)}
          </Link>
        ))}
      </div>
      <p className="text-sm opacity-60">{t('sourceOfficial')}</p>
    </main>
  );
}
