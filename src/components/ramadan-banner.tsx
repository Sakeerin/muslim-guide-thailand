import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { currentRamadanWindow } from '@/server/services/ramadan';
import { getPrayerTimes } from '@/server/services/prayer-times';
import { ramadanDay, suhurIftar } from '@/lib/ramadan';

/**
 * Site-wide banner shown ONLY during Ramadan (from official islamic_events).
 * Server component — renders nothing outside Ramadan, so it's a no-op cost
 * the rest of the year. Uses Bangkok as the reference province for the banner
 * time (the /ramadan page has per-city times).
 */
export async function RamadanBanner() {
  const window = await currentRamadanWindow();
  if (!window) return null;

  const t = await getTranslations('ramadan');
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date());
  const times = await getPrayerTimes('10', today, today); // Bangkok
  const day = times.days[0];
  const iftar = day ? suhurIftar(day).iftar : '—';
  const dayNo = ramadanDay(window, today) ?? 1;

  return (
    <div className="bg-emerald-700 text-white">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm">
        <span>🌙 {t('bannerActive', { day: dayNo, iftar })}</span>
        <Link href="/ramadan" className="font-medium underline">
          {t('bannerView')} →
        </Link>
      </div>
    </div>
  );
}
