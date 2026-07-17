/**
 * Helpers for de-duplicating imported places against the existing catalog.
 * The heavy matching (trigram similarity + geo distance) runs in Postgres;
 * these pure helpers normalize names so comparisons are stable, and define
 * the thresholds the import review UI uses to flag likely duplicates.
 */

// Generic place-type prefixes/words that add noise to name matching, per script.
const NOISE_WORDS = [
  'มัสยิด', 'สุเหร่า', 'บาลาเซาะ',
  'masjid', 'masjed', 'mosque', 'surau', 'musalla', 'musholla',
  'مسجد', 'مصلى',
  'ร้าน', 'ร้านอาหาร', 'restaurant', 'restoran', 'مطعم',
];

/**
 * Normalize a place name for comparison: NFKC, lowercase, strip zero-width,
 * drop generic type words, collapse whitespace/punctuation to single spaces.
 */
export function normalizePlaceName(name: string): string {
  let s = (name ?? '').normalize('NFKC').toLowerCase();
  s = s.replace(/[​-‍﻿]/g, '');
  // separate words, drop noise words, rejoin
  s = s.replace(/[^\p{L}\p{M}\p{N}]+/gu, ' ').trim();
  const kept = s.split(' ').filter((w) => w && !NOISE_WORDS.includes(w));
  // if removing noise emptied it (e.g. name was just "มัสยิด"), keep original tokens
  return (kept.length ? kept : s.split(' ')).join(' ').trim();
}

/** Stable dedupe key: normalized name — used to collapse duplicates in staging. */
export function dedupeKey(name: string): string {
  return normalizePlaceName(name).replace(/\s+/g, '');
}

/** Candidate is a likely duplicate if it's very close AND names are similar,
 *  or effectively the same spot regardless of name. */
export const MATCH = {
  /** within this many metres → same physical location candidate */
  nearMeters: 150,
  /** pg_trgm similarity at/above this on normalized names → strong name match */
  strongNameSim: 0.6,
  /** below this distance we treat it as a duplicate even on a weaker name match */
  autoDuplicateMeters: 40,
} as const;

export interface MatchCandidate {
  distanceM: number;
  nameSimilarity: number;
}

/** Whether a candidate should be auto-flagged as a likely duplicate. */
export function isLikelyDuplicate(c: MatchCandidate): boolean {
  if (c.distanceM <= MATCH.autoDuplicateMeters) return true;
  return c.distanceM <= MATCH.nearMeters && c.nameSimilarity >= MATCH.strongNameSim;
}
