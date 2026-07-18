import { listPublishedQABySlug } from '@/server/services/qa';
import { apiError, apiOk } from '@/lib/api';

/** Published Q&A for a place (questions + their answers). Public — no auth. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const questions = await listPublishedQABySlug(slug);
  if (questions === null) return apiError(404, 'not_found', 'Place not found');

  return apiOk(
    { questions },
    { headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } },
  );
}
