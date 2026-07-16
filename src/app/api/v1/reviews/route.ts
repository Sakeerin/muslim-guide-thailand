import { type NextRequest } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/server/auth';
import { createReviewSchema } from '@/lib/validators/review';
import { createReview, hasReviewConsent } from '@/server/services/reviews';
import { apiOk, apiError, apiValidationError } from '@/lib/api';

/** Post a review. Requires a signed-in user (any account); staff or public. */
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return apiError(401, 'unauthorized', 'Sign in required');

  // PDPA gate: publishing a review (which reveals the author publicly) needs
  // recorded review_publication consent at the current policy version.
  if (!(await hasReviewConsent(session.user.id))) {
    return apiError(403, 'consent_required', 'Review publication consent required');
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return apiError(400, 'invalid_json', 'Body must be JSON');
  }
  const parsed = createReviewSchema.safeParse(json);
  if (!parsed.success) return apiValidationError(parsed.error);

  const result = await createReview({
    placeId: parsed.data.placeId,
    userId: session.user.id,
    rating: parsed.data.rating,
    body: parsed.data.body,
    lang: parsed.data.lang,
  });

  // status tells the UI whether it's live or held for moderation
  return apiOk({ id: result.id, status: result.status });
}
