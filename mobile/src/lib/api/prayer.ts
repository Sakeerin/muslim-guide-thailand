import type { PrayerTimesResponse } from '@/types/api';
import { apiFetch } from './client';

/** GET /api/v1/prayer-times?province=..&from=..&to=.. (from/to default server-side). */
export function getPrayerTimes(
  province: string,
  opts: { from?: string; to?: string } = {},
  signal?: AbortSignal,
): Promise<PrayerTimesResponse> {
  return apiFetch<PrayerTimesResponse>('/api/v1/prayer-times', {
    query: { province, from: opts.from, to: opts.to },
    signal,
  });
}
