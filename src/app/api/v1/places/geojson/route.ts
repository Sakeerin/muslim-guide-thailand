import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { placesGeoJson } from '@/server/services/places';
import { apiValidationError } from '@/lib/api';

const querySchema = z.object({
  locale: z.string().min(2).max(5).default('en'),
  type: z.enum(['restaurant', 'mosque', 'prayer_room', 'attraction', 'hotel', 'shop']).optional(),
  // bbox = "west,south,east,north"
  bbox: z
    .string()
    .optional()
    .transform((v) => (v ? v.split(',').map(Number) : undefined))
    .pipe(z.array(z.number()).length(4).optional()),
});

export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) return apiValidationError(parsed.error);

  const { locale, type, bbox } = parsed.data;
  const fc = await placesGeoJson(locale, bbox as [number, number, number, number] | undefined, type);

  return Response.json(fc, {
    headers: { 'Cache-Control': 'public, max-age=120, stale-while-revalidate=600' },
  });
}
