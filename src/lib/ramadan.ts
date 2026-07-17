/**
 * Ramadan helpers — pure logic over the official islamic_events + prayer times.
 * The window comes from สำนักจุฬาราชมนตรี moon-sighting announcements
 * (islamic_events: ramadan_start_XXXX → eid_fitr_XXXX), never a calculation.
 */

export interface IslamicEvent {
  key: string;
  gdate: string; // YYYY-MM-DD (Asia/Bangkok calendar day)
  title?: string | null;
}

export interface RamadanWindow {
  hijriYear: string; // '1448'
  start: string; // YYYY-MM-DD (1 Ramadan)
  end: string; // YYYY-MM-DD (Eid al-Fitr = 1 Shawwal; last fast is the day before)
}

/**
 * Resolve Ramadan windows from events. Pairs each `ramadan_start_<year>` with
 * the matching `eid_fitr_<year>`; if Eid is missing, assumes a 30-day month.
 */
export function ramadanWindows(events: IslamicEvent[]): RamadanWindow[] {
  const starts = events.filter((e) => e.key.startsWith('ramadan_start_'));
  const windows: RamadanWindow[] = [];
  for (const s of starts) {
    const year = s.key.replace('ramadan_start_', '');
    const eid = events.find((e) => e.key === `eid_fitr_${year}`);
    const end = eid?.gdate ?? addDays(s.gdate, 30);
    windows.push({ hijriYear: year, start: s.gdate, end });
  }
  return windows.sort((a, b) => a.start.localeCompare(b.start));
}

function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T12:00:00+07:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** The Ramadan window active on `today` (YYYY-MM-DD, Bangkok), or null. */
export function activeRamadan(windows: RamadanWindow[], today: string): RamadanWindow | null {
  // active from 1 Ramadan up to (but not including) Eid — the last fast is Eid-eve
  return windows.find((w) => today >= w.start && today < w.end) ?? null;
}

/** The next upcoming window (start in the future), or null. */
export function upcomingRamadan(windows: RamadanWindow[], today: string): RamadanWindow | null {
  return windows.find((w) => w.start > today) ?? null;
}

export interface DayTimes {
  imsak?: string | null;
  fajr: string;
  maghrib: string;
}

export interface SuhurIftar {
  suhurEnds: string; // HH:MM — stop eating (imsak if present, else fajr)
  iftar: string; // HH:MM — break fast (maghrib)
}

export function suhurIftar(day: DayTimes): SuhurIftar {
  return {
    suhurEnds: (day.imsak ?? day.fajr).slice(0, 5),
    iftar: day.maghrib.slice(0, 5),
  };
}

/**
 * Which day of Ramadan `today` is (1-based), or null if outside.
 * Both dates are Bangkok calendar days.
 */
export function ramadanDay(window: RamadanWindow, today: string): number | null {
  if (today < window.start || today >= window.end) return null;
  const start = new Date(`${window.start}T12:00:00+07:00`).getTime();
  const now = new Date(`${today}T12:00:00+07:00`).getTime();
  return Math.round((now - start) / 86_400_000) + 1;
}
