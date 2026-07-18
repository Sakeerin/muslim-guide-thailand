import type { HalalStatus } from '@/types/api';

export const HALAL_STATUSES: readonly HalalStatus[] = [
  'cicot_certified',
  'muslim_owned',
  'muslim_friendly',
  'unverified',
];

/** Higher = more trusted. Used for emphasis/sorting; never reorders near-me. */
export function trustRank(status: string): number {
  switch (status) {
    case 'cicot_certified':
      return 3;
    case 'muslim_owned':
      return 2;
    case 'muslim_friendly':
      return 1;
    default:
      return 0;
  }
}

/** Key under the "trust" i18n namespace; unknown statuses render as unverified. */
export function halalLabelKey(status: string): HalalStatus {
  return (HALAL_STATUSES as readonly string[]).includes(status)
    ? (status as HalalStatus)
    : 'unverified';
}

export type HalalTone = 'certified' | 'owned' | 'friendly' | 'unverified';

export function halalTone(status: string): HalalTone {
  switch (status) {
    case 'cicot_certified':
      return 'certified';
    case 'muslim_owned':
      return 'owned';
    case 'muslim_friendly':
      return 'friendly';
    default:
      return 'unverified';
  }
}

/**
 * A sponsored placement is active only while featuredUntil is in the future.
 * Mirrors the web app's src/lib/featured.ts. Pure.
 */
export function isFeatured(until: string | Date | null | undefined, now: Date = new Date()): boolean {
  if (!until) return false;
  const when = typeof until === 'string' ? new Date(until) : until;
  const t = when.getTime();
  if (Number.isNaN(t)) return false;
  return t > now.getTime();
}
