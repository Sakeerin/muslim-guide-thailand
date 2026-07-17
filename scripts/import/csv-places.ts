import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { ingestRecords, type IngestRecord } from '../../src/server/services/imports';

/**
 * Generic CSV → import STAGING. For open-data exports the team obtains from
 * GD Catalog (mosques), TAT / Thailand Tourism Directory, or CICOT/THIC.
 * Records land as pending for staff review in /admin/import.
 *
 * Usage: pnpm tsx scripts/import/csv-places.ts <file.csv> --source gdcatalog --type mosque \
 *          [--attribution "..."]
 * CSV columns (header row): source_ref,name_th,name_en,lat,lng,address_th
 */
function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function parseCsvLine(line: string): string[] {
  // minimal CSV: handles quoted fields with commas
  const out: string[] = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') inQ = false;
      else cur += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ',') { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

async function main() {
  const file = process.argv[2];
  const source = argValue('--source');
  const type = (argValue('--type') ?? 'mosque') as IngestRecord['placeType'];
  const attribution = argValue('--attribution');
  if (!file || !source) {
    console.error('Usage: csv-places.ts <file.csv> --source <name> --type <placeType> [--attribution "..."]');
    process.exit(1);
  }

  const text = readFileSync(file, 'utf8').trim();
  const [headerLine, ...lines] = text.split(/\r?\n/);
  const header = parseCsvLine(headerLine);
  const col = (name: string) => header.indexOf(name);

  const records: IngestRecord[] = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    const c = parseCsvLine(line);
    const lat = Number(c[col('lat')]);
    const lng = Number(c[col('lng')]);
    if (Number.isNaN(lat) || Number.isNaN(lng)) continue;
    const nameTh = c[col('name_th')];
    const nameEn = col('name_en') >= 0 ? c[col('name_en')] : undefined;
    if (!nameTh && !nameEn) continue;
    records.push({
      source,
      sourceRef: c[col('source_ref')] || `${lat},${lng}`,
      placeType: type,
      name: { ...(nameTh ? { th: nameTh } : {}), ...(nameEn ? { en: nameEn } : {}) },
      address: col('address_th') >= 0 && c[col('address_th')] ? { th: c[col('address_th')] } : undefined,
      lat,
      lng,
      raw: Object.fromEntries(header.map((h, i) => [h, c[i]])),
      attribution,
    });
  }

  const n = await ingestRecords(records);
  console.log(`Staged ${n} record(s) from ${file} (source=${source}) → review at /admin/import`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
