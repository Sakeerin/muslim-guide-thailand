import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { sql } from 'drizzle-orm';
import { db } from '../../src/server/db/client';
import { prayerTimesOfficial } from '../../src/server/db/schema';
import { calculatePrayerTimes } from '../../src/lib/prayer/adhan';
import { CITIES } from '../seed/data/cities';

/**
 * Ingest official prayer-time tables published by สำนักจุฬาราชมนตรี.
 *
 * Real data:  pnpm tsx scripts/prayer-times/import-official.ts <file.csv>
 *   CSV columns: province_code,date(YYYY-MM-DD),imsak,fajr,sunrise,dhuhr,asr,maghrib,isha
 *
 * Dev sample: pnpm tsx scripts/prayer-times/import-official.ts --sample [year]
 *   Generates a full-year table for the launch provinces so the "official-first"
 *   serving path can be exercised. Rows are clearly marked as SAMPLE in
 *   source_note — they are NOT real announcements and MUST be replaced with the
 *   official published tables before launch (prayer times affect real worship).
 */

interface Row {
  provinceCode: string;
  gdate: string;
  imsak: string | null;
  fajr: string;
  sunrise: string | null;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  sourceNote: string;
  sourceYear: number;
}

function hmBangkok(d: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Bangkok',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
}

function subtractMinutes(hm: string, mins: number): string {
  const [h, m] = hm.split(':').map(Number);
  let total = h * 60 + m - mins;
  if (total < 0) total += 1440;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function generateSample(year: number): Row[] {
  const rows: Row[] = [];
  const note = `ตัวอย่างสำหรับพัฒนา (SAMPLE) — ต้องแทนที่ด้วยประกาศสำนักจุฬาราชมนตรีจริงก่อนเปิดตัว`;
  for (const city of CITIES) {
    const start = new Date(`${year}-01-01T12:00:00+07:00`);
    const end = new Date(`${year}-12-31T12:00:00+07:00`);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const { times } = calculatePrayerTimes(city.lat, city.lng, new Date(d));
      const fajr = hmBangkok(times.fajr);
      rows.push({
        provinceCode: city.provinceCode,
        gdate: d.toISOString().slice(0, 10),
        imsak: subtractMinutes(fajr, 10), // imsak ≈ 10 min before fajr
        fajr,
        sunrise: hmBangkok(times.sunrise),
        dhuhr: hmBangkok(times.dhuhr),
        asr: hmBangkok(times.asr),
        maghrib: hmBangkok(times.maghrib),
        isha: hmBangkok(times.isha),
        sourceNote: note,
        sourceYear: year,
      });
    }
  }
  return rows;
}

function parseCsv(path: string): Row[] {
  const text = readFileSync(path, 'utf8').trim();
  const lines = text.split(/\r?\n/);
  const header = lines[0].split(',').map((h) => h.trim());
  const idx = (name: string) => header.indexOf(name);
  return lines.slice(1).map((line) => {
    const c = line.split(',');
    const year = Number(c[idx('date')].slice(0, 4));
    return {
      provinceCode: c[idx('province_code')].trim(),
      gdate: c[idx('date')].trim(),
      imsak: c[idx('imsak')]?.trim() || null,
      fajr: c[idx('fajr')].trim(),
      sunrise: c[idx('sunrise')]?.trim() || null,
      dhuhr: c[idx('dhuhr')].trim(),
      asr: c[idx('asr')].trim(),
      maghrib: c[idx('maghrib')].trim(),
      isha: c[idx('isha')].trim(),
      sourceNote: 'ประกาศสำนักจุฬาราชมนตรี',
      sourceYear: year,
    };
  });
}

async function main() {
  const args = process.argv.slice(2);
  let rows: Row[];

  if (args[0] === '--sample') {
    const year = Number(args[1]) || new Date(Date.now()).getFullYear();
    rows = generateSample(year);
    console.log(`Generated ${rows.length} SAMPLE rows for ${CITIES.length} provinces (${year})`);
  } else if (args[0]) {
    rows = parseCsv(args[0]);
    console.log(`Parsed ${rows.length} rows from ${args[0]}`);
  } else {
    console.error('Usage: import-official.ts <file.csv> | --sample [year]');
    process.exit(1);
  }

  // batch upsert
  const CHUNK = 500;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const batch = rows.slice(i, i + CHUNK);
    await db
      .insert(prayerTimesOfficial)
      .values(batch)
      .onConflictDoUpdate({
        target: [prayerTimesOfficial.provinceCode, prayerTimesOfficial.gdate],
        set: {
          imsak: sql`excluded.imsak`,
          fajr: sql`excluded.fajr`,
          sunrise: sql`excluded.sunrise`,
          dhuhr: sql`excluded.dhuhr`,
          asr: sql`excluded.asr`,
          maghrib: sql`excluded.maghrib`,
          isha: sql`excluded.isha`,
          sourceNote: sql`excluded.source_note`,
          sourceYear: sql`excluded.source_year`,
        },
      });
  }

  console.log(`Imported/updated ${rows.length} prayer-time rows.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
