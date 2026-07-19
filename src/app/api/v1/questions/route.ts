import { type NextRequest } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/server/auth';
import { createQuestionSchema } from '@/lib/validators/qa';
import { createQuestion } from '@/server/services/qa';
import { hasReviewConsent } from '@/server/services/reviews';
import { apiError, apiOk, apiValidationError } from '@/lib/api';
import { communityUgcEnabled } from '@/lib/flags';
import { RATE_LIMITS, checkRateLimit, rateLimitedResponse } from '@/lib/rate-limit-guard';

/** Ask a question about a place. Requires sign-in + the same PDPA publication
 *  consent as reviews (the author is shown publicly). */
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return apiError(401, 'unauthorized', 'Sign in required');
  if (!communityUgcEnabled()) {
    return apiError(403, 'feature_disabled', 'Q&A is not available yet');
  }
  const rl = checkRateLimit(session.user.id, RATE_LIMITS.ugcWrite);
  if (!rl.allowed) return rateLimitedResponse(rl);
  if (!(await hasReviewConsent(session.user.id))) {
    return apiError(403, 'consent_required', 'Publication consent required');
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return apiError(400, 'invalid_json', 'Body must be JSON');
  }
  const parsed = createQuestionSchema.safeParse(json);
  if (!parsed.success) return apiValidationError(parsed.error);

  const result = await createQuestion({
    placeId: parsed.data.placeId,
    userId: session.user.id,
    body: parsed.data.body,
    lang: parsed.data.lang,
  });
  return apiOk({ id: result.id, status: result.status });
}
