import { type NextRequest } from 'next/server';
import { headers } from 'next/headers';
import { z } from 'zod';
import { auth } from '@/server/auth';
import { db } from '@/server/db/client';
import { consentLogs, pushSubscriptions } from '@/server/db/schema';
import { apiError, apiOk, apiValidationError } from '@/lib/api';
import { CURRENT_POLICY_VERSION } from '@/lib/consent';
import { PUSH_TOPICS } from '@/lib/push';
import { locales } from '@/i18n/routing';

// web-push / crypto never runs here, but the sender does elsewhere — keep the
// whole /api/v1/push surface explicitly on Node so nothing drifts to Edge.
export const runtime = 'nodejs';

const bodySchema = z.object({
  subscription: z.object({
    endpoint: z.url(),
    keys: z.object({
      p256dh: z.string().min(1),
      auth: z.string().min(1),
    }),
  }),
  locale: z.enum(locales).optional(),
  topics: z.array(z.enum(PUSH_TOPICS)).optional(),
});

/**
 * Register (or refresh) a Web Push subscription. Anonymous by default — the
 * browser permission grant + this explicit opt-in is the PDPA consent, recorded
 * as consentPolicyVersion on the row. Links to the account if signed in.
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

  const { subscription, locale, topics } = parsed.data;
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user.id ?? null;
  const userAgent = request.headers.get('user-agent') ?? null;
  const now = new Date();

  await db
    .insert(pushSubscriptions)
    .values({
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      userId,
      locale: locale ?? null,
      topics: topics ?? [...PUSH_TOPICS],
      userAgent,
      consentPolicyVersion: CURRENT_POLICY_VERSION,
    })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: {
        // keys can rotate for the same endpoint; keep them fresh
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userId,
        locale: locale ?? null,
        topics: topics ?? [...PUSH_TOPICS],
        userAgent,
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

  return apiOk({ subscribed: true });
}
