/**
 * Hijri date display.
 * Baseline: Umm al-Qura calendar via Intl (works offline, all runtimes).
 * IMPORTANT: Ramadan/Eid start dates shown to users are OVERRIDDEN by
 * official Thai moon-sighting announcements stored in `islamic_events`
 * (merged at the service layer) — the calculated date is a fallback only.
 */

const HIJRI_LOCALE_MAP: Record<string, string> = {
  th: 'th-u-ca-islamic-umalqura-nu-latn',
  en: 'en-u-ca-islamic-umalqura-nu-latn',
  ms: 'ms-u-ca-islamic-umalqura-nu-latn',
  id: 'id-u-ca-islamic-umalqura-nu-latn',
  ar: 'ar-u-ca-islamic-umalqura-nu-latn',
};

export function formatHijriDate(date: Date, locale: string): string {
  const tag = HIJRI_LOCALE_MAP[locale] ?? HIJRI_LOCALE_MAP.en;
  return new Intl.DateTimeFormat(tag, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Bangkok',
  }).format(date);
}

export interface HijriParts {
  day: number;
  month: number; // 1-12 (1 = Muharram, 9 = Ramadan)
  year: number;
}

export function hijriParts(date: Date): HijriParts {
  const parts = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    timeZone: 'Asia/Bangkok',
  }).formatToParts(date);
  const get = (type: string) =>
    parseInt(parts.find((p) => p.type === type)?.value ?? '0', 10);
  return { day: get('day'), month: get('month'), year: get('year') };
}
