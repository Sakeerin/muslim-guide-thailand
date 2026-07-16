import { type NextRequest } from 'next/server';
import { headers } from 'next/headers';
import { z } from 'zod';
import { auth } from '@/server/auth';
import { db } from '@/server/db/client';
import { consentLogs } from '@/server/db/schema';
import { apiOk, apiError, apiValidationError } from '@/lib/api';
import { CONSENT_KEYS, CURRENT_POLICY_VERSION } from '@/lib/consent';

const bodySchema = z.object({
  consents: z.array(z.enum(CONSENT_KEYS)).min(1),
});

/** Record granular PDPA consent for the signed-in user. */
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return apiError(401, 'unauthorized', 'Sign in required');

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return apiError(400, 'invalid_json', 'Body must be JSON');
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return apiValidationError(parsed.error);

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
  await db.insert(consentLogs).values(
    parsed.data.consents.map((consentKey) => ({
      userId: session.user.id,
      consentKey,
      granted: true,
      policyVersion: CURRENT_POLICY_VERSION,
      ip,
    })),
  );

  return apiOk({ recorded: parsed.data.consents.length });
}
