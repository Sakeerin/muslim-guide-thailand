import { describe, expect, it } from 'vitest';
import { openStatusAt, parseHm } from '@/lib/opening-hours';

// A fixed instant we can reason about in Asia/Bangkok (UTC+7).
// 2026-01-07 is a Wednesday.
function bkk(dateISO: string, hhmm: string): Date {
  return new Date(`${dateISO}T${hhmm}:00+07:00`);
}

describe('parseHm', () => {
  it('parses valid times', () => {
    expect(parseHm('07:30')).toBe(450);
    expect(parseHm('00:00')).toBe(0);
    expect(parseHm('23:59')).toBe(1439);
  });
  it('rejects malformed input', () => {
    expect(parseHm('7:30 pm')).toBeNull();
    expect(parseHm('25:00')).toBeNull();
    expect(parseHm('')).toBeNull();
  });
});

describe('openStatusAt', () => {
  const weekday = { wed: [['10:00', '22:00']] as [string, string][] };

  it('returns unknown when no hours data', () => {
    expect(openStatusAt(null, bkk('2026-01-07', '12:00')).known).toBe(false);
    expect(openStatusAt({}, bkk('2026-01-07', '12:00')).known).toBe(false);
  });

  it('is open inside a same-day range', () => {
    const s = openStatusAt(weekday, bkk('2026-01-07', '12:00'));
    expect(s).toMatchObject({ open: true, known: true, closesAt: '22:00' });
  });

  it('is closed before opening and reports next opening', () => {
    const s = openStatusAt(weekday, bkk('2026-01-07', '08:00'));
    expect(s).toMatchObject({ open: false, known: true, opensAt: '10:00' });
  });

  it('is closed after closing', () => {
    const s = openStatusAt(weekday, bkk('2026-01-07', '23:00'));
    expect(s.open).toBe(false);
  });

  it('handles an overnight range starting the same day (18:00-02:00)', () => {
    const hours = { wed: [['18:00', '02:00']] as [string, string][] };
    // 20:00 Wed → still open (after 18:00 start)
    expect(openStatusAt(hours, bkk('2026-01-07', '20:00')).open).toBe(true);
  });

  it('handles overnight spill into the next morning', () => {
    // Wed 18:00-02:00 → Thursday 01:00 should read as open (spill from Wed)
    const hours = { wed: [['18:00', '02:00']] as [string, string][] };
    const s = openStatusAt(hours, bkk('2026-01-08', '01:00')); // Thursday 01:00
    expect(s).toMatchObject({ open: true, closesAt: '02:00' });
  });

  it('is closed on a day with no ranges', () => {
    const hours = { wed: [['10:00', '22:00']] as [string, string][] };
    const s = openStatusAt(hours, bkk('2026-01-08', '12:00')); // Thursday, no hours
    expect(s).toMatchObject({ open: false, known: true });
  });

  it('evaluates the Bangkok weekday regardless of the runtime clock offset', () => {
    // 2026-01-07 23:30 UTC is already 2026-01-08 06:30 in Bangkok (Thursday)
    const hours = { thu: [['06:00', '14:00']] as [string, string][] };
    const utcLateWed = new Date('2026-01-07T23:30:00Z');
    expect(openStatusAt(hours, utcLateWed).open).toBe(true);
  });
});
