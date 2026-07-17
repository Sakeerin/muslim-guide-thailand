import type { Metadata } from 'next';
import { getLocale, getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { listCities } from '@/server/services/places';
import { getRamadanInfo } from '@/server/services/ramadan';
import { resolveI18n } from '@/lib/i18n-content';
import { alternatesFor } from '@/lib/seo';
import { PlaceCard } from '@/components/place-card';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'ramadan' });
  return { title: t('title'), alternates: alternatesFor('/ramadan') };
}

function fmtDate(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : locale, {
    dateStyle: 'long',
    timeZone: 'Asia/Bangkok',
  }).format(new Date(`${iso}T12:00:00+07:00`));
}

export default async function RamadanPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ city?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { city: citySlug } = await searchParams;

  const [t, currentLocale, cities] = await Promise.all([
    getTranslations('ramadan'),
    getLocale(),
    listCities(),
  ]);

  const selectedCity = citySlug ?? cities[0]?.slug;
  const info = selectedCity ? await getRamadanInfo(selectedCity) : null;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">🌙 {t('title')}</h1>
        <form method="GET" className="flex items-center gap-2">
          <select name="city" defaultValue={selectedCity} className="rounded-lg border bg-background px-3 py-1.5 text-sm">
            {cities.map((c) => (
              <option key={c.slug} value={c.slug}>
                {resolveI18n(c.name as never, currentLocale)}
              </option>
            ))}
          </select>
          <button className="rounded-lg border px-3 py-1.5 text-sm hover:bg-foreground/5">
            {t('selectCity')}
          </button>
        </form>
      </header>

      {info?.active ? (
        <>
          <section className="rounded-2xl border bg-emerald-50 p-6 text-center dark:bg-emerald-950/30">
            {info.dayNumber && <p className="text-sm opacity-70">{t('dayOf', { day: info.dayNumber })}</p>}
            <div className="mt-3 grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm opacity-70">{t('suhurEnds')}</p>
                <p className="text-3xl font-bold tabular-nums">{info.suhurEnds ?? '—'}</p>
              </div>
              <div>
                <p className="text-sm opacity-70">{t('iftar')}</p>
                <p className="text-3xl font-bold tabular-nums">{info.iftar ?? '—'}</p>
              </div>
            </div>
            <p className="mt-3 text-xs opacity-60">
              {info.source === 'official' ? t('sourceOfficial') : t('sourceCalculated')}
            </p>
          </section>

          {info.iftarOpenRestaurants.length > 0 && (
            <section>
              <h2 className="mb-3 font-semibold">{t('openForIftar')}</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {info.iftarOpenRestaurants.map((r) => (
                  <PlaceCard
                    key={r.slug}
                    place={{ id: r.slug, slug: r.slug, name: r.name, halalStatus: r.halalStatus, type: 'restaurant' } as never}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      ) : (
        <section className="rounded-2xl border p-6">
          <p className="opacity-80">{t('notNow')}</p>
          {info?.upcoming && (
            <p className="mt-2 text-lg font-medium">
              {t('upcoming', { year: info.upcoming.hijriYear, date: fmtDate(info.upcoming.start, locale) })}
            </p>
          )}
          <Link href="/prayer-times" className="mt-3 inline-block text-sm underline">
            {t('sourceOfficial')} →
          </Link>
        </section>
      )}
    </main>
  );
}
