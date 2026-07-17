import { describe, expect, it } from 'vitest';
import {
  activeRamadan,
  ramadanDay,
  ramadanWindows,
  suhurIftar,
  upcomingRamadan,
} from '@/lib/ramadan';

const EVENTS = [
  { key: 'ramadan_start_1448', gdate: '2027-02-18', title: 'Ramadan' },
  { key: 'eid_fitr_1448', gdate: '2027-03-20', title: 'Eid' },
  { key: 'ramadan_start_1447', gdate: '2026-02-28' }, // no eid → assume +30
];

describe('ramadanWindows', () => {
  it('pairs start with eid, sorted by start', () => {
    const w = ramadanWindows(EVENTS);
    expect(w).toHaveLength(2);
    expect(w[0]).toMatchObject({ hijriYear: '1447', start: '2026-02-28', end: '2026-03-30' });
    expect(w[1]).toMatchObject({ hijriYear: '1448', start: '2027-02-18', end: '2027-03-20' });
  });
});

describe('activeRamadan / upcomingRamadan', () => {
  const w = ramadanWindows(EVENTS);
  it('is active on a day inside the window (Eid-eve inclusive, Eid exclusive)', () => {
    expect(activeRamadan(w, '2027-03-01')?.hijriYear).toBe('1448');
    expect(activeRamadan(w, '2027-02-18')?.hijriYear).toBe('1448'); // 1 Ramadan
    expect(activeRamadan(w, '2027-03-19')?.hijriYear).toBe('1448'); // last fast
    expect(activeRamadan(w, '2027-03-20')).toBeNull(); // Eid day — not fasting
  });
  it('finds the next upcoming window', () => {
    expect(upcomingRamadan(w, '2026-12-01')?.hijriYear).toBe('1448');
    expect(upcomingRamadan(w, '2099-01-01')).toBeNull();
  });
});

describe('suhurIftar', () => {
  it('uses imsak for suhur end when present, else fajr; maghrib for iftar', () => {
    expect(suhurIftar({ imsak: '04:21:00', fajr: '04:31:00', maghrib: '18:50:00' })).toEqual({
      suhurEnds: '04:21',
      iftar: '18:50',
    });
    expect(suhurIftar({ imsak: null, fajr: '05:00:00', maghrib: '18:00:00' })).toEqual({
      suhurEnds: '05:00',
      iftar: '18:00',
    });
  });
});

describe('ramadanDay', () => {
  const w = ramadanWindows(EVENTS)[1]; // 1448
  it('counts the day of Ramadan (1-based)', () => {
    expect(ramadanDay(w, '2027-02-18')).toBe(1);
    expect(ramadanDay(w, '2027-02-20')).toBe(3);
    expect(ramadanDay(w, '2027-03-20')).toBeNull(); // Eid
  });
});
