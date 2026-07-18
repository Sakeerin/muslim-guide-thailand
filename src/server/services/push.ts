import { sendNotification, setVapidDetails, type PushSubscription } from 'web-push';
import { Expo, type ExpoPushTicket } from 'expo-server-sdk';
import { arrayContains, inArray } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { pushDevices, pushSubscriptions } from '@/server/db/schema';
import {
  buildAnnouncementPayload,
  shouldPrunePushError,
  type AnnouncementContent,
  type PushTopic,
} from '@/lib/push';
import { classifyExpoTicket, toExpoMessage } from '@/lib/push-expo';
import { writeAudit } from './audit';

// notifications are time-sensitive (announcement day) but not urgent-to-the-second
const TTL_SECONDS = 60 * 60 * 24; // 1 day

export interface TransportResult {
  total: number;
  sent: number;
  failed: number;
  pruned: number;
}
export type BroadcastResult = TransportResult;

const ZERO: TransportResult = { total: 0, sent: 0, failed: 0, pruned: 0 };

// ── Web Push transport ──────────────────────────────────────────────────────

function hasVapid(): boolean {
  return Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

let vapidConfigured = false;
function ensureVapid() {
  if (vapidConfigured) return;
  setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:no-reply@localhost',
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
  vapidConfigured = true;
}

async function sendWebPushBroadcast(
  content: AnnouncementContent,
  topic?: PushTopic,
): Promise<TransportResult> {
  if (!hasVapid()) return ZERO; // web push not configured — Expo can still send
  ensureVapid();

  const rows = await db
    .select({
      endpoint: pushSubscriptions.endpoint,
      p256dh: pushSubscriptions.p256dh,
      auth: pushSubscriptions.auth,
      locale: pushSubscriptions.locale,
    })
    .from(pushSubscriptions)
    .where(topic ? arrayContains(pushSubscriptions.topics, [topic]) : undefined);

  const dead: string[] = [];
  const results = await Promise.allSettled(
    rows.map(async (r) => {
      const payload = buildAnnouncementPayload(content, r.locale ?? 'en');
      const sub: PushSubscription = { endpoint: r.endpoint, keys: { p256dh: r.p256dh, auth: r.auth } };
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
  return { total: rows.length, sent, failed, pruned };
}

// ── Expo (native) transport ─────────────────────────────────────────────────

let expoClient: Expo | null = null;
function getExpo(): Expo {
  if (!expoClient) {
    const accessToken = process.env.EXPO_ACCESS_TOKEN; // only needed with Enhanced Security
    expoClient = new Expo(accessToken ? { accessToken } : {});
  }
  return expoClient;
}

async function sendExpoBroadcast(
  content: AnnouncementContent,
  topic?: PushTopic,
): Promise<TransportResult> {
  const rows = await db
    .select({ token: pushDevices.token, locale: pushDevices.locale })
    .from(pushDevices)
    .where(topic ? arrayContains(pushDevices.topics, [topic]) : undefined);

  // drop malformed tokens up front so index↔token alignment holds per chunk
  const valid = rows.filter((r) => Expo.isExpoPushToken(r.token));
  const messages = valid.map((r) => toExpoMessage(r.token, content, r.locale ?? 'en'));

  const client = getExpo();
  const chunks = client.chunkPushNotifications(messages); // <=100 per chunk, order preserved
  const dead: string[] = [];
  let sent = 0;
  let failed = 0;

  for (const chunk of chunks) {
    let tickets: ExpoPushTicket[];
    try {
      tickets = await client.sendPushNotificationsAsync(chunk);
    } catch {
      failed += chunk.length; // whole-chunk transport error — keep the tokens
      continue;
    }
    tickets.forEach((ticket, i) => {
      const outcome = classifyExpoTicket(ticket);
      if (outcome === 'sent') {
        sent += 1;
        return;
      }
      failed += 1;
      if (outcome === 'prune') {
        const to = chunk[i]!.to;
        if (typeof to === 'string') dead.push(to);
      }
    });
  }

  let pruned = 0;
  if (dead.length > 0) {
    await db.delete(pushDevices).where(inArray(pushDevices.token, dead));
    pruned = dead.length;
  }
  return { total: valid.length, sent, failed, pruned };
}

// ── Public API ──────────────────────────────────────────────────────────────

function settledValue(result: PromiseSettledResult<TransportResult>): TransportResult {
  return result.status === 'fulfilled' ? result.value : ZERO;
}

/**
 * Send an announcement to every web-push subscription AND every Expo device
 * (optionally scoped to a topic), each in the subscriber's own locale. The two
 * transports are isolated: a failure or missing config in one never blocks the
 * other. Result is the combined tally so callers (admin action, cron) are
 * unchanged. Expired endpoints/tokens are pruned.
 */
export async function broadcast(
  content: AnnouncementContent,
  opts: { topic?: PushTopic; actorId?: string } = {},
): Promise<BroadcastResult> {
  const settled = await Promise.allSettled([
    sendWebPushBroadcast(content, opts.topic),
    sendExpoBroadcast(content, opts.topic),
  ]);
  const web = settledValue(settled[0]);
  const expo = settledValue(settled[1]);

  const merged: BroadcastResult = {
    total: web.total + expo.total,
    sent: web.sent + expo.sent,
    failed: web.failed + expo.failed,
    pruned: web.pruned + expo.pruned,
  };

  if (opts.actorId) {
    await writeAudit({
      actorId: opts.actorId,
      action: 'push.broadcast',
      entityType: 'push',
      entityId: opts.topic ?? 'all',
      diff: { ...merged, web, expo, topic: opts.topic ?? null },
    });
  }

  return merged;
}

/** Count of live web-push subscriptions, for the admin dashboard. */
export async function countSubscriptions(): Promise<number> {
  const rows = await db.select({ endpoint: pushSubscriptions.endpoint }).from(pushSubscriptions);
  return rows.length;
}

/** Count of live Expo device tokens, for the admin dashboard. */
export async function countDevices(): Promise<number> {
  const rows = await db.select({ token: pushDevices.token }).from(pushDevices);
  return rows.length;
}
