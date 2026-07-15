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
  const t = await getTranslations({ locale, namespace: 'home' });
  return {
    title: t('heroTitle'),
    description: t('heroSubtitle'),
    alternates: alternatesFor('/'),
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, currentLocale, cities] = await Promise.all([
    getTranslations(),
    getLocale(),
    listCities(),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-4 py-10">
      <section className="flex flex-col gap-3 text-center">
        <h1 className="text-3xl font-bold sm:text-4xl">{t('home.heroTitle')}</h1>
        <p className="text-lg opacity-80">{t('home.heroSubtitle')}</p>
      </section>

      <nav className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Link href="/search" className="rounded-xl border p-4 text-center font-medium hover:bg-foreground/5">
          {t('common.search')}
        </Link>
        <Link href="/nearby" className="rounded-xl border p-4 text-center font-medium hover:bg-foreground/5">
          {t('common.nearMe')}
        </Link>
        <Link href="/prayer-times" className="rounded-xl border p-4 text-center font-medium hover:bg-foreground/5">
          {t('nav.prayerTimes')}
        </Link>
        <Link href="/qibla" className="rounded-xl border p-4 text-center font-medium hover:bg-foreground/5">
          {t('nav.qibla')}
        </Link>
      </nav>

      <section>
        <h2 className="mb-4 text-xl font-semibold">{t('home.popularCities')}</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {cities.map((city) => (
            <Link
              key={city.slug}
              href={`/${city.slug}`}
              className="rounded-xl border p-4 text-center font-medium hover:bg-foreground/5"
            >
              {resolveI18n(city.name as never, currentLocale)}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
