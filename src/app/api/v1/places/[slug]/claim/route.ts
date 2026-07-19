import { type NextRequest } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/server/auth';
import { db } from '@/server/db/client';
import { places } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { createClaimSchema } from '@/lib/validators/claim';
import { createClaim } from '@/server/services/claims';
import { apiOk, apiError, apiValidationError } from '@/lib/api';
import { RATE_LIMITS, checkRateLimit, rateLimitedResponse } from '@/lib/rate-limit-guard';

/** Submit an ownership claim for a place. Requires sign-in; goes to the
 *  admin queue (staff grants ownership after checking). */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return apiError(401, 'unauthorized', 'Sign in required');

  const rl = checkRateLimit(session.user.id, RATE_LIMITS.claim);
  if (!rl.allowed) return rateLimitedResponse(rl);

  const { slug } = await params;
  const place = await db.query.places.findFirst({ where: eq(places.slug, slug) });
  if (!place) return apiError(404, 'not_found', 'Place not found');
  if (place.ownerUserId) return apiError(409, 'already_claimed', 'This place is already claimed');

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return apiError(400, 'invalid_json', 'Body must be JSON');
  }
  const parsed = createClaimSchema.safeParse({ ...(json as object), placeId: place.id });
  if (!parsed.success) return apiValidationError(parsed.error);
  if (parsed.data.website) return apiOk({ received: true }); // honeypot

  const result = await createClaim({
    placeId: place.id,
    userId: session.user.id,
    contact: parsed.data.contact,
    message: parsed.data.message,
  });
  return apiOk({ received: true, id: result.id });
}
