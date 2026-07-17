import { type NextRequest } from 'next/server';
import { headers } from 'next/headers';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { auth } from '@/server/auth';
import { db } from '@/server/db/client';
import { consentLogs, pushSubscriptions } from '@/server/db/schema';
import { apiError, apiOk, apiValidationError } from '@/lib/api';
import { CURRENT_POLICY_VERSION } from '@/lib/consent';

export const runtime = 'nodejs';

const bodySchema = z.object({
  endpoint: z.url(),
});

/**
 * Withdraw a Web Push subscription. PDPA: the endpoint + keys identify a
 * device, so withdrawal is a hard DELETE of the row (not a disabled flag).
 * Records a granted:false audit entry for signed-in users.
 */
export async function POST(request: NextRequest) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return apiError(400, 'invalid_json', 'Body must be JSON');
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return apiValidationError(parsed.error);

  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, parsed.data.endpoint));

  const session = await auth.api.getSession({ headers: await headers() });
  if (session) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
    await db.insert(consentLogs).values({
      userId: session.user.id,
      consentKey: 'push_notifications',
      granted: false,
      policyVersion: CURRENT_POLICY_VERSION,
      ip,
    });
  }

  return apiOk({ unsubscribed: true });
}
