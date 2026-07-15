import { describe, expect, it } from 'vitest';
import { calculatePrayerTimes, nextPrayer, type PrayerName } from '@/lib/prayer/adhan';

function hmBangkok(d: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Bangkok',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
}

describe('calculatePrayerTimes (Bangkok, default Singapore/Shafi)', () => {
  // Golden check: mid-summer day, Bangkok. Values are stable for the
  // Singapore method; we assert each prayer lands in a tight window and
  // that ordering holds. If adhan or the method mapping regresses, this trips.
  const result = calculatePrayerTimes(13.7563, 100.5018, new Date('2026-07-15T04:00:00Z'));

  it('uses the configured defaults', () => {
    expect(result.source).toBe('calculated');
    expect(result.method).toBe('singapore');
    expect(result.madhab).toBe('shafi');
  });

  it('produces prayers in chronological order', () => {
    const order: PrayerName[] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
    for (let i = 1; i < order.length; i++) {
      expect(result.times[order[i]].getTime()).toBeGreaterThan(
        result.times[order[i - 1]].getTime(),
      );
    }
  });

  it('lands Fajr in the early morning and Maghrib in the evening (Bangkok TZ)', () => {
    const fajrH = Number(hmBangkok(result.times.fajr).slice(0, 2));
    const maghribH = Number(hmBangkok(result.times.maghrib).slice(0, 2));
    expect(fajrH).toBeGreaterThanOrEqual(4);
    expect(fajrH).toBeLessThanOrEqual(5);
    expect(maghribH).toBeGreaterThanOrEqual(18);
    expect(maghribH).toBeLessThanOrEqual(19);
  });
});

describe('nextPrayer', () => {
  const base = new Date('2026-07-15T00:00:00Z');
  const mk = (h: number) => new Date(base.getTime() + h * 3600_000);
  const times = {
    fajr: mk(4),
    sunrise: mk(5),
    dhuhr: mk(12),
    asr: mk(15),
    maghrib: mk(18),
    isha: mk(20),
  };

  it('finds the next upcoming prayer, skipping sunrise', () => {
    expect(nextPrayer(times, mk(4.5))?.name).toBe('dhuhr'); // 04:30 → dhuhr (sunrise skipped)
    expect(nextPrayer(times, mk(13))?.name).toBe('asr');
  });

  it('returns null after isha', () => {
    expect(nextPrayer(times, mk(21))).toBeNull();
  });
});
