import type { DayPrayerTimes } from '@/types/api';

/** The five daily prayers, in order. Sunrise/imsak are shown but not "next". */
export const PRAYER_ORDER = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;
export type PrayerName = (typeof PRAYER_ORDER)[number];

/**
 * Normalize a DB time ("HH:MM:SS" from the official table, or "HH:MM" from the
 * calculated fallback) to "HH:MM". Latin digits, no Intl (Hermes-safe). Pure.
 */
export function formatClock(time: string | null | undefined): string {
  if (!time) return '—';
  return time.slice(0, 5);
}

/** "HH:MM" → minutes since midnight, or null if unparseable. */
export function toMinutes(hhmm: string | null | undefined): number | null {
  if (!hhmm) return null;
  const m = /^(\d{1,2}):(\d{2})/.exec(hhmm);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

/**
 * The next upcoming prayer for a given day at time `nowHm` ("HH:MM"), or null
 * if all five have passed. Pure — the screen supplies the current time.
 */
export function nextPrayer(
  day: DayPrayerTimes,
  nowHm: string,
): { name: PrayerName; time: string } | null {
  const now = toMinutes(nowHm);
  if (now == null) return null;
  for (const name of PRAYER_ORDER) {
    const t = toMinutes(day[name]);
    if (t != null && t > now) return { name, time: formatClock(day[name]) };
  }
  return null;
}
