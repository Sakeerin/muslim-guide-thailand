import type { Metadata } from 'next';
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { alternatesFor } from '@/lib/seo';
import { formatHijriDate } from '@/lib/prayer/hijri';
import { listIslamicEvents } from '@/server/services/prayer-times';

export const dynamic = 'force-dynamic';

const TITLE: Record<string, string> = {
  th: 'ปฏิทินอิสลาม',
  en: 'Islamic calendar',
  ms: 'Kalendar Islam',
  id: 'Kalender Islam',
  ar: 'التقويم الإسلامي',
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: TITLE[locale] ?? TITLE.en,
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
  const [format, tPrayer] = await Promise.all([getFormatter(), getTranslations('prayer')]);

  const today = new Date();
  const events = await listIslamicEvents();
  const upcoming = events.filter((e) => new Date(`${e.gdate}T00:00:00+07:00`) >= new Date(today.toDateString()));

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10">
      <header>
        <h1 className="text-3xl font-bold">{TITLE[locale] ?? TITLE.en}</h1>
        <p className="mt-2 text-lg">{formatHijriDate(today, locale)}</p>
        <p className="text-sm opacity-70">
          {format.dateTime(today, { dateStyle: 'full' })}
        </p>
      </header>

      <section>
        <h2 className="mb-3 font-semibold">
          {locale === 'th' ? 'วันสำคัญที่จะถึง' : 'Upcoming dates'}
        </h2>
        {upcoming.length === 0 ? (
          <p className="text-sm opacity-60">
            {locale === 'th'
              ? 'ยังไม่มีประกาศวันสำคัญ'
              : 'No announced dates yet'}
          </p>
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
        {locale === 'th'
          ? 'วันเริ่มรอมฎอนและวันอีดยึดตามประกาศดูดวงจันทร์ของสำนักจุฬาราชมนตรี ข้อมูลที่แสดงเป็นเพียงตัวอย่างระหว่างการพัฒนา'
          : tPrayer('sourceOfficial')}
      </p>
    </main>
  );
}
