import type { NextRequest } from 'next/server';
import { prayerTimesQuerySchema } from '@/lib/validators/submission';
import { getPrayerTimes } from '@/server/services/prayer-times';
import { apiOk, apiValidationError } from '@/lib/api';

function todayBangkok(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date());
}

function plusDays(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00+07:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = prayerTimesQuerySchema.safeParse(params);
  if (!parsed.success) return apiValidationError(parsed.error);

  const from = parsed.data.from ?? todayBangkok();
  const to = parsed.data.to ?? plusDays(from, 30);

  const result = await getPrayerTimes(parsed.data.province, from, to);
  return apiOk(result, {
    // official tables change once a year — cache hard at the CDN
    headers: { 'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400' },
  });
}
