import { getPlaceBySlug, prayerPlacesNearby } from '@/server/services/places';
import { apiOk, apiError } from '@/lib/api';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const place = await getPlaceBySlug(slug);
  if (!place) return apiError(404, 'not_found', 'Place not found');

  const prayerNearby = await prayerPlacesNearby(place.lat, place.lng);
  return apiOk(
    { place, prayerNearby },
    { headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600' } },
  );
}
