import { and, eq, inArray, sql } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { cities, places } from '@/server/db/schema';
import { getPrayerTimes, listIslamicEvents } from './prayer-times';
import {
  activeRamadan,
  ramadanDay,
  ramadanWindows,
  suhurIftar,
  upcomingRamadan,
  type RamadanWindow,
} from '@/lib/ramadan';
import { openStatusAt } from '@/lib/opening-hours';
import type { OpeningHours } from '@/server/db/schema/types';

function todayBangkok(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date());
}

export interface RamadanRestaurant {
  slug: string;
  name: Record<string, string>;
  halalStatus: string;
}

export interface RamadanInfo {
  today: string;
  active: RamadanWindow | null;
  upcoming: RamadanWindow | null;
  dayNumber: number | null;
  /** today's suhur-end + iftar for the province (official-first) */
  suhurEnds: string | null;
  iftar: string | null;
  source: 'official' | 'calculated' | null;
  /** restaurants open at iftar time in the city (nice for breaking fast) */
  iftarOpenRestaurants: RamadanRestaurant[];
}

/**
 * Ramadan dashboard data for a city: the active/upcoming window (from official
 * announcements), today's suhur/iftar times, and restaurants open at iftar.
 */
export async function getRamadanInfo(citySlug: string): Promise<RamadanInfo | null> {
  const city = await db.query.cities.findFirst({ where: eq(cities.slug, citySlug) });
  if (!city) return null;

  const today = todayBangkok();
  const events = await listIslamicEvents();
  const windows = ramadanWindows(events.map((e) => ({ key: e.key, gdate: e.gdate, title: e.title })));
  const active = activeRamadan(windows, today);
  const upcoming = active ? null : upcomingRamadan(windows, today);

  // today's times (official table first, adhan fallback)
  const times = await getPrayerTimes(city.provinceCode, today, today);
  const day = times.days[0];
  const si = day ? suhurIftar(day) : null;

  let iftarOpenRestaurants: RamadanRestaurant[] = [];
  if (active && si) {
    // "open at iftar": restaurant open at maghrib today (Asia/Bangkok)
    const iftarInstant = new Date(`${today}T${si.iftar}:00+07:00`);
    const rows = await db
      .select({
        slug: places.slug,
        name: places.name,
        halalStatus: places.halalStatus,
        openingHours: places.openingHours,
      })
      .from(places)
      .where(
        and(
          eq(places.cityId, city.id),
          eq(places.type, 'restaurant'),
          inArray(places.status, ['published', 'published_unverified']),
          sql`${places.openingHours} IS NOT NULL`,
        ),
      )
      .limit(60);
    iftarOpenRestaurants = rows
      .filter((r) => openStatusAt(r.openingHours as OpeningHours, iftarInstant).open)
      .slice(0, 12)
      .map((r) => ({ slug: r.slug, name: r.name as Record<string, string>, halalStatus: r.halalStatus }));
  }

  return {
    today,
    active,
    upcoming,
    dayNumber: active ? ramadanDay(active, today) : null,
    suhurEnds: si?.suhurEnds ?? null,
    iftar: si?.iftar ?? null,
    source: times.source,
    iftarOpenRestaurants,
  };
}

/** Lightweight check for the site-wide banner (no per-city query). */
export async function currentRamadanWindow(): Promise<RamadanWindow | null> {
  const events = await listIslamicEvents();
  const windows = ramadanWindows(events.map((e) => ({ key: e.key, gdate: e.gdate, title: e.title })));
  return activeRamadan(windows, todayBangkok());
}
