import { sendNotification, setVapidDetails, type PushSubscription } from 'web-push';
import { arrayContains, inArray } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { pushSubscriptions } from '@/server/db/schema';
import {
  buildAnnouncementPayload,
  shouldPrunePushError,
  type AnnouncementContent,
  type PushTopic,
} from '@/lib/push';
import { writeAudit } from './audit';

// notifications are time-sensitive (announcement day) but not urgent-to-the-second
const TTL_SECONDS = 60 * 60 * 24; // 1 day

let vapidConfigured = false;
function ensureVapid() {
  if (vapidConfigured) return;
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) {
    throw new Error('Web Push not configured: set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY');
  }
  setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:no-reply@localhost', pub, priv);
  vapidConfigured = true;
}

export interface BroadcastResult {
  total: number;
  sent: number;
  failed: number;
  pruned: number;
}

/**
 * Send an announcement to every subscription (optionally scoped to a topic).
 * Each device gets its content in its own locale. Expired endpoints (404/410)
 * are pruned so the table doesn't accumulate dead rows.
 */
export async function broadcast(
  content: AnnouncementContent,
  opts: { topic?: PushTopic; actorId?: string } = {},
): Promise<BroadcastResult> {
  ensureVapid();

  const rows = await db
    .select({
      endpoint: pushSubscriptions.endpoint,
      p256dh: pushSubscriptions.p256dh,
      auth: pushSubscriptions.auth,
      locale: pushSubscriptions.locale,
    })
    .from(pushSubscriptions)
    .where(opts.topic ? arrayContains(pushSubscriptions.topics, [opts.topic]) : undefined);

  const dead: string[] = [];
  const results = await Promise.allSettled(
    rows.map(async (r) => {
      const payload = buildAnnouncementPayload(content, r.locale ?? 'en');
      const sub: PushSubscription = {
        endpoint: r.endpoint,
        keys: { p256dh: r.p256dh, auth: r.auth },
      };
      try {
        await sendNotification(sub, JSON.stringify(payload), { TTL: TTL_SECONDS });
      } catch (err) {
        if (shouldPrunePushError(err)) dead.push(r.endpoint);
        throw err;
      }
    }),
  );

  let sent = 0;
  let failed = 0;
  for (const res of results) {
    if (res.status === 'fulfilled') sent += 1;
    else failed += 1;
  }

  let pruned = 0;
  if (dead.length > 0) {
    await db.delete(pushSubscriptions).where(inArray(pushSubscriptions.endpoint, dead));
    pruned = dead.length;
  }

  if (opts.actorId) {
    await writeAudit({
      actorId: opts.actorId,
      action: 'push.broadcast',
      entityType: 'push',
      entityId: opts.topic ?? 'all',
      diff: { total: rows.length, sent, failed, pruned, topic: opts.topic ?? null },
    });
  }

  return { total: rows.length, sent, failed, pruned };
}

/** Count of live subscriptions, for the admin dashboard. */
export async function countSubscriptions(): Promise<number> {
  const rows = await db
    .select({ endpoint: pushSubscriptions.endpoint })
    .from(pushSubscriptions);
  return rows.length;
}
