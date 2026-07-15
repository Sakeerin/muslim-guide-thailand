import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { getCityBySlug } from '@/server/services/places';
import { getPrayerTimes } from '@/server/services/prayer-times';
import { resolveI18n } from '@/lib/i18n-content';
import { alternatesFor } from '@/lib/seo';
import { formatHijriDate } from '@/lib/prayer/hijri';

export const dynamic = 'force-dynamic';

function todayBangkok(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date());
}

function plusDays(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00+07:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; city: string }>;
}): Promise<Metadata> {
  const { locale, city: citySlug } = await params;
  const city = await getCityBySlug(citySlug);
  if (!city) return {};
  const t = await getTranslations({ locale, namespace: 'prayer' });
  return {
    title: t('titleProvince', { province: resolveI18n(city.name as never, locale) }),
    alternates: alternatesFor(`/prayer-times/${citySlug}`),
  };
}

export default async function PrayerTimesCityPage({
  params,
}: {
  params: Promise<{ locale: string; city: string }>;
}) {
  const { locale, city: citySlug } = await params;
  setRequestLocale(locale);

  const city = await getCityBySlug(citySlug);
  if (!city) notFound();

  const [t, format] = await Promise.all([getTranslations('prayer'), getFormatter()]);
  const today = todayBangkok();
  const result = await getPrayerTimes(city.provinceCode, today, plusDays(today, 29));
  const todayRow = result.days.find((d) => d.date === today) ?? result.days[0];
  const cityName = resolveI18n(city.name as never, locale);

  const PRAYERS = [
    { key: 'imsak' as const, optional: true },
    { key: 'fajr' as const },
    { key: 'sunrise' as const, optional: true },
    { key: 'dhuhr' as const },
    { key: 'asr' as const },
    { key: 'maghrib' as const },
    { key: 'isha' as const },
  ];

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10">
      <header>
        <h1 className="text-3xl font-bold">{t('titleProvince', { province: cityName })}</h1>
        <p className="mt-1 opacity-70">
          {format.dateTime(new Date(`${today}T12:00:00+07:00`), { dateStyle: 'full' })}
          {' · '}
          {formatHijriDate(new Date(`${today}T12:00:00+07:00`), locale)}
        </p>
        <p
          className={`mt-2 inline-block rounded-full px-3 py-1 text-xs ${
            result.source === 'official'
              ? 'bg-emerald-100 text-emerald-900'
              : 'bg-amber-100 text-amber-900'
          }`}
        >
          {result.source === 'official' ? t('sourceOfficial') : t('sourceCalculated')}
        </p>
      </header>

      {todayRow && (
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label={t('today')}>
          {PRAYERS.map(({ key, optional }) => {
            const value = todayRow[key];
            if (optional && !value) return null;
            return (
              <div key={key} className="rounded-xl border p-4 text-center">
                <p className="text-sm opacity-70">{t(key)}</p>
                <p className="mt-1 text-xl font-bold tabular-nums">
                  {value?.slice(0, 5) ?? '—'}
                </p>
              </div>
            );
          })}
        </section>
      )}

      <section>
        <h2 className="mb-3 font-semibold">{t('monthlyTable')}</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm tabular-nums">
            <thead>
              <tr className="border-b text-start">
                <th className="py-2 pe-3 text-start font-medium">{t('today')}</th>
                <th className="py-2 pe-3 text-start font-medium">{t('fajr')}</th>
                <th className="py-2 pe-3 text-start font-medium">{t('dhuhr')}</th>
                <th className="py-2 pe-3 text-start font-medium">{t('asr')}</th>
                <th className="py-2 pe-3 text-start font-medium">{t('maghrib')}</th>
                <th className="py-2 text-start font-medium">{t('isha')}</th>
              </tr>
            </thead>
            <tbody>
              {result.days.map((day) => (
                <tr key={day.date} className={`border-b last:border-0 ${day.date === today ? 'bg-foreground/5 font-medium' : ''}`}>
                  <td className="py-1.5 pe-3">{day.date.slice(8)}/{day.date.slice(5, 7)}</td>
                  <td className="py-1.5 pe-3">{day.fajr.slice(0, 5)}</td>
                  <td className="py-1.5 pe-3">{day.dhuhr.slice(0, 5)}</td>
                  <td className="py-1.5 pe-3">{day.asr.slice(0, 5)}</td>
                  <td className="py-1.5 pe-3">{day.maghrib.slice(0, 5)}</td>
                  <td className="py-1.5">{day.isha.slice(0, 5)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
