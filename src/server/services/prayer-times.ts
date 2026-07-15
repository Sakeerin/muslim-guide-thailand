import { and, asc, eq, gte, lte, sql } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { cities, islamicEvents, prayerTimesOfficial } from '@/server/db/schema';
import { calculatePrayerTimes } from '@/lib/prayer/adhan';

export interface DayPrayerTimes {
  date: string; // YYYY-MM-DD
  imsak?: string | null;
  fajr: string;
  sunrise?: string | null;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
}

export interface PrayerTimesResponse {
  provinceCode: string;
  source: 'official' | 'calculated';
  sourceNote?: string;
  days: DayPrayerTimes[];
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function hmInBangkok(d: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Bangkok',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
}

/** Fallback coordinates per province come from the cities table (city center). */
async function provinceCoordinates(
  provinceCode: string,
): Promise<{ lat: number; lng: number } | null> {
  const rows = await db
    .select({
      lat: sql<number>`ST_Y(${cities.center}::geometry)`,
      lng: sql<number>`ST_X(${cities.center}::geometry)`,
    })
    .from(cities)
    .where(eq(cities.provinceCode, provinceCode))
    .limit(1);
  const row = rows[0];
  return row ? { lat: Number(row.lat), lng: Number(row.lng) } : null;
}

/**
 * Official-first prayer times:
 * 1. rows from prayer_times_official (Chularajmontri announcement)
 * 2. fallback: adhan-js calculation, clearly labelled "calculated".
 */
export async function getPrayerTimes(
  provinceCode: string,
  from: string,
  to: string,
): Promise<PrayerTimesResponse> {
  const official = await db
    .select()
    .from(prayerTimesOfficial)
    .where(
      and(
        eq(prayerTimesOfficial.provinceCode, provinceCode),
        gte(prayerTimesOfficial.gdate, from),
        lte(prayerTimesOfficial.gdate, to),
      ),
    )
    .orderBy(asc(prayerTimesOfficial.gdate));

  if (official.length > 0) {
    return {
      provinceCode,
      source: 'official',
      sourceNote: official[0].sourceNote ?? undefined,
      days: official.map((r) => ({
        date: r.gdate,
        imsak: r.imsak,
        fajr: r.fajr,
        sunrise: r.sunrise,
        dhuhr: r.dhuhr,
        asr: r.asr,
        maghrib: r.maghrib,
        isha: r.isha,
      })),
    };
  }

  const coords = (await provinceCoordinates(provinceCode)) ?? {
    lat: 13.7563,
    lng: 100.5018, // Bangkok default
  };

  const days: DayPrayerTimes[] = [];
  const start = new Date(`${from}T12:00:00+07:00`);
  const end = new Date(`${to}T12:00:00+07:00`);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const { times } = calculatePrayerTimes(coords.lat, coords.lng, new Date(d));
    days.push({
      date: isoDate(new Date(d)),
      fajr: hmInBangkok(times.fajr),
      sunrise: hmInBangkok(times.sunrise),
      dhuhr: hmInBangkok(times.dhuhr),
      asr: hmInBangkok(times.asr),
      maghrib: hmInBangkok(times.maghrib),
      isha: hmInBangkok(times.isha),
    });
  }

  return { provinceCode, source: 'calculated', days };
}

/** Provinces that have at least one active city (MVP: the 7 launch cities). */
export async function listProvinces() {
  return db
    .selectDistinct({ provinceCode: cities.provinceCode })
    .from(cities)
    .where(eq(cities.isActive, true));
}

/** Official Islamic events (Ramadan/Eid per Thai moon-sighting announcements). */
export async function listIslamicEvents() {
  return db.select().from(islamicEvents).orderBy(asc(islamicEvents.gdate));
}
