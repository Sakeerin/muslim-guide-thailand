import { listPublishedReviewsBySlug } from '@/server/services/reviews';
import { apiError, apiOk } from '@/lib/api';

/** Published reviews for a place (newest first). Public — no auth. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const reviews = await listPublishedReviewsBySlug(slug);
  if (reviews === null) return apiError(404, 'not_found', 'Place not found');

  return apiOk(
    { reviews },
    { headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } },
  );
}
