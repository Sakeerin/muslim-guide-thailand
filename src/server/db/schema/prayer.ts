import {
  date,
  integer,
  pgTable,
  primaryKey,
  text,
  time,
  timestamp,
} from 'drizzle-orm/pg-core';

/**
 * Official prayer times published by สำนักจุฬาราชมนตรี (Sheikhul Islam Office),
 * per province per day. Served with source:"official"; adhan-js calculation
 * is the fallback and is always labelled "calculated (approximate)".
 * ~28k rows/year — tiny.
 */
export const prayerTimesOfficial = pgTable(
  'prayer_times_official',
  {
    provinceCode: text('province_code').notNull(),
    gdate: date('gdate').notNull(),
    imsak: time('imsak'),
    fajr: time('fajr').notNull(),
    sunrise: time('sunrise'),
    dhuhr: time('dhuhr').notNull(),
    asr: time('asr').notNull(),
    maghrib: time('maghrib').notNull(),
    isha: time('isha').notNull(),
    sourceYear: integer('source_year').notNull(),
    sourceNote: text('source_note'), // 'ประกาศสำนักจุฬาราชมนตรี พ.ศ. ...'
    importedAt: timestamp('imported_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.provinceCode, t.gdate] })],
);

/**
 * Important Islamic dates per official Thai moon-sighting announcements —
 * these OVERRIDE calculated hijri dates (Ramadan start, Eid, etc.).
 */
export const islamicEvents = pgTable('islamic_events', {
  key: text('key').primaryKey(), // 'ramadan_start_1448', 'eid_fitr_1448'
  gdate: date('gdate').notNull(),
  hijriDate: text('hijri_date'),
  title: text('title'),
  source: text('source').notNull().default('สำนักจุฬาราชมนตรี'),
  announcedAt: timestamp('announced_at', { withTimezone: true }),
});
