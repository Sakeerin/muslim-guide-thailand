import type { Metadata } from 'next';
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { alternatesFor } from '@/lib/seo';
import { formatHijriDate } from '@/lib/prayer/hijri';
import { listIslamicEvents } from '@/server/services/prayer-times';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'islamicCalendar' });
  return {
    title: t('title'),
    alternates: alternatesFor('/islamic-calendar'),
  };
}

export default async function IslamicCalendarPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [format, t] = await Promise.all([getFormatter(), getTranslations('islamicCalendar')]);

  const today = new Date();
  const events = await listIslamicEvents();
  const upcoming = events.filter((e) => new Date(`${e.gdate}T00:00:00+07:00`) >= new Date(today.toDateString()));

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10">
      <header>
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="mt-2 text-lg">{formatHijriDate(today, locale)}</p>
        <p className="text-sm opacity-70">
          {format.dateTime(today, { dateStyle: 'full' })}
        </p>
      </header>

      <section>
        <h2 className="mb-3 font-semibold">{t('upcoming')}</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm opacity-60">{t('empty')}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {upcoming.map((e) => (
              <li key={e.key} className="rounded-xl border p-4">
                <p className="font-medium">{e.title ?? e.key}</p>
                <p className="text-sm opacity-80">
                  {format.dateTime(new Date(`${e.gdate}T00:00:00+07:00`), { dateStyle: 'long' })}
                  {e.hijriDate ? ` · ${e.hijriDate}` : ''}
                </p>
                <p className="mt-1 text-xs opacity-60">{e.source}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="rounded-xl bg-foreground/5 p-3 text-xs opacity-70">
        {t('sourceNote')}
      </p>
    </main>
  );
}
