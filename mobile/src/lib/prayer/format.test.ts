import { describe, expect, it } from 'vitest';
import type { DayPrayerTimes } from '@/types/api';
import { formatClock, nextPrayer, toMinutes } from './format';

describe('formatClock', () => {
  it('trims seconds from the official "HH:MM:SS" and passes "HH:MM"', () => {
    expect(formatClock('05:12:00')).toBe('05:12');
    expect(formatClock('18:45')).toBe('18:45');
  });
  it('shows a dash for missing times', () => {
    expect(formatClock(null)).toBe('—');
    expect(formatClock(undefined)).toBe('—');
  });
});

describe('toMinutes', () => {
  it('parses HH:MM(:SS) to minutes since midnight', () => {
    expect(toMinutes('00:00')).toBe(0);
    expect(toMinutes('05:12:00')).toBe(312);
    expect(toMinutes('23:59')).toBe(1439);
  });
  it('returns null for invalid input', () => {
    expect(toMinutes(null)).toBeNull();
    expect(toMinutes('99:99')).toBeNull();
    expect(toMinutes('nope')).toBeNull();
  });
});

const day: DayPrayerTimes = {
  date: '2026-07-18',
  fajr: '05:00:00',
  dhuhr: '12:15:00',
  asr: '15:30:00',
  maghrib: '18:45:00',
  isha: '20:00:00',
};

describe('nextPrayer', () => {
  it('finds the next upcoming prayer', () => {
    expect(nextPrayer(day, '13:00')).toEqual({ name: 'asr', time: '15:30' });
    expect(nextPrayer(day, '04:00')).toEqual({ name: 'fajr', time: '05:00' });
  });

  it('returns null once isha has passed', () => {
    expect(nextPrayer(day, '21:00')).toBeNull();
  });

  it('returns null for an unparseable current time', () => {
    expect(nextPrayer(day, 'xx')).toBeNull();
  });
});
