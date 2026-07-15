import type { OpeningHours } from '@/server/db/schema/types';

export type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

const DAY_KEYS: DayKey[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

/** "HH:MM" → minutes since midnight. Returns null for malformed input. */
export function parseHm(value: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (h > 24 || min > 59) return null;
  return h * 60 + min;
}

interface BangkokMoment {
  dayIndex: number; // 0 = sun ... 6 = sat, in Asia/Bangkok
  minutes: number; // minutes since midnight in Asia/Bangkok
}

/** Current weekday + time-of-day in Asia/Bangkok regardless of runtime TZ. */
export function bangkokMoment(date: Date): BangkokMoment {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Bangkok',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  const weekday = get('weekday').toLowerCase().slice(0, 3);
  const dayIndex = DAY_KEYS.indexOf(weekday as DayKey);
  // Intl may emit "24" for midnight with hour12:false in some engines
  const hour = parseInt(get('hour'), 10) % 24;
  const minutes = hour * 60 + parseInt(get('minute'), 10);
  return { dayIndex, minutes };
}

export interface OpenStatus {
  open: boolean;
  /** "HH:MM" the current range closes (when open) */
  closesAt?: string;
  /** "HH:MM" the next range opens today (when closed and known) */
  opensAt?: string;
  /** false when hours data is missing → status unknown, don't show a chip */
  known: boolean;
}

/**
 * Open/closed status at a moment, in Asia/Bangkok.
 * Handles overnight ranges (e.g. 18:00–02:00): a range whose close <= open
 * spans midnight — it covers open→24:00 today and 00:00→close tomorrow.
 * No data → known:false (never guess).
 */
export function openStatusAt(
  hours: OpeningHours | null | undefined,
  date: Date,
): OpenStatus {
  if (!hours || Object.keys(hours).length === 0) {
    return { open: false, known: false };
  }

  const { dayIndex, minutes } = bangkokMoment(date);
  const today = DAY_KEYS[dayIndex];
  const yesterday = DAY_KEYS[(dayIndex + 6) % 7];

  // Overnight spill from yesterday: range with close <= open covers early today
  for (const [start, end] of hours[yesterday] ?? []) {
    const s = parseHm(start);
    const e = parseHm(end);
    if (s === null || e === null) continue;
    if (e <= s && minutes < e) {
      return { open: true, closesAt: end, known: true };
    }
  }

  let nextOpen: number | null = null;
  let nextOpenStr: string | undefined;

  for (const [start, end] of hours[today] ?? []) {
    const s = parseHm(start);
    const e = parseHm(end);
    if (s === null || e === null) continue;

    if (e > s) {
      // normal same-day range
      if (minutes >= s && minutes < e) return { open: true, closesAt: end, known: true };
    } else {
      // overnight range starting today
      if (minutes >= s) return { open: true, closesAt: end, known: true };
    }

    if (s > minutes && (nextOpen === null || s < nextOpen)) {
      nextOpen = s;
      nextOpenStr = start;
    }
  }

  return { open: false, opensAt: nextOpenStr, known: true };
}
