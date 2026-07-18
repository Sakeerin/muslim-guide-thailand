import { type NextRequest } from 'next/server';
import { headers } from 'next/headers';
import { z } from 'zod';
import { auth } from '@/server/auth';
import { db } from '@/server/db/client';
import { consentLogs, pushDevices } from '@/server/db/schema';
import { apiError, apiOk, apiValidationError } from '@/lib/api';
import { CURRENT_POLICY_VERSION } from '@/lib/consent';
import { PUSH_TOPICS, isExpoPushToken } from '@/lib/push';
import { locales } from '@/i18n/routing';

export const runtime = 'nodejs';

const bodySchema = z.object({
  token: z.string().refine(isExpoPushToken, 'Invalid Expo push token'),
  platform: z.enum(['ios', 'android']).optional(),
  locale: z.enum(locales).optional(),
  topics: z.array(z.enum(PUSH_TOPICS)).optional(),
});

/**
 * Register (or refresh) an Expo push device token. Anonymous by default — the
 * OS permission grant + this explicit opt-in is the PDPA consent, recorded as
 * consentPolicyVersion on the row. Links to the account if signed in.
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

  const { token, platform, locale, topics } = parsed.data;
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user.id ?? null;
  const now = new Date();

  await db
    .insert(pushDevices)
    .values({
      token,
      platform: platform ?? null,
      userId,
      locale: locale ?? null,
      topics: topics ?? [...PUSH_TOPICS],
      consentPolicyVersion: CURRENT_POLICY_VERSION,
    })
    .onConflictDoUpdate({
      target: pushDevices.token,
      // refresh linkage/preferences; preserve original consent version/timestamp
      set: {
        platform: platform ?? null,
        userId,
        locale: locale ?? null,
        topics: topics ?? [...PUSH_TOPICS],
        lastSeenAt: now,
      },
    });

  // Durable audit trail for signed-in users (anonymous consent lives on the row).
  if (userId) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
    await db.insert(consentLogs).values({
      userId,
      consentKey: 'push_notifications',
      granted: true,
      policyVersion: CURRENT_POLICY_VERSION,
      ip,
    });
  }

  return apiOk({ registered: true });
}
