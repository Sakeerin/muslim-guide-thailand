import type { HalalStatus } from '@/lib/validators/place';

/** L1 (CICOT) and L2 (Muslim-owned) require a second reviewer (4-eyes). */
export function isFourEyesRequired(status: HalalStatus): boolean {
  return status === 'cicot_certified' || status === 'muslim_owned';
}

export type ExpiryBucket = 'expired' | 'lte30' | 'lte60' | 'lte90' | 'later';

export function expiryBucket(daysLeft: number): ExpiryBucket {
  if (daysLeft < 0) return 'expired';
  if (daysLeft <= 30) return 'lte30';
  if (daysLeft <= 60) return 'lte60';
  if (daysLeft <= 90) return 'lte90';
  return 'later';
}

export const REVIEW_INTERVAL_MONTHS = 6;

export function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export function nextReviewDate(from: Date): Date {
  return addMonths(from, REVIEW_INTERVAL_MONTHS);
}
