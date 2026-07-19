import { type NextRequest } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/server/auth';
import { createAnswerSchema } from '@/lib/validators/qa';
import { createAnswer } from '@/server/services/qa';
import { hasReviewConsent } from '@/server/services/reviews';
import { apiError, apiOk, apiValidationError } from '@/lib/api';
import { communityUgcEnabled } from '@/lib/flags';
import { RATE_LIMITS, checkRateLimit, rateLimitedResponse } from '@/lib/rate-limit-guard';

/** Answer a published question. Requires sign-in + PDPA publication consent. */
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
  const parsed = createAnswerSchema.safeParse(json);
  if (!parsed.success) return apiValidationError(parsed.error);

  const result = await createAnswer({
    questionId: parsed.data.questionId,
    userId: session.user.id,
    body: parsed.data.body,
    lang: parsed.data.lang,
  });
  if (result === null) return apiError(404, 'not_found', 'Question not found');

  return apiOk({ id: result.id, status: result.status });
}
