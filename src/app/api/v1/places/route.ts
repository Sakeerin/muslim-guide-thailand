import type { NextRequest } from 'next/server';
import { listPlacesQuerySchema } from '@/lib/validators/place';
import { listPlaces } from '@/server/services/places';
import { apiOk, apiValidationError } from '@/lib/api';

export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = listPlacesQuerySchema.safeParse(params);
  if (!parsed.success) return apiValidationError(parsed.error);

  const result = await listPlaces(parsed.data);
  return apiOk(result, {
    headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' },
  });
}
