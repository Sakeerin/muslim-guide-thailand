import type { ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import { buildAnnouncementPayload, type AnnouncementContent } from '@/lib/push';

/**
 * Pure Expo-push helpers. The `expo-server-sdk` import is TYPE-ONLY (erased at
 * build), so this module carries no runtime dependency on the Node-only ESM SDK
 * and unit-tests on any machine. The actual `new Expo()` + send lives in the
 * Node service (src/server/services/push.ts).
 */

/** Map the shared announcement payload to one Expo message for a token+locale. */
export function toExpoMessage(
  token: string,
  content: AnnouncementContent,
  locale: string,
): ExpoPushMessage {
  const p = buildAnnouncementPayload(content, locale); // { title, body, url, icon, tag, lang }
  return {
    to: token,
    title: p.title,
    body: p.body,
    sound: 'default',
    priority: 'high',
    channelId: 'announcements', // must match the Android channel the app creates; iOS ignores
    // replace-not-stack repeats of the same announcement (Android tag + iOS collapseId)
    ...(p.tag ? { tag: p.tag, collapseId: p.tag } : {}),
    // the app deep-links off data.url on tap
    data: { url: p.url, tag: p.tag ?? null, lang: p.lang },
  };
}

export type ExpoTicketOutcome = 'sent' | 'prune' | 'failed';

/**
 * Classify a send ticket. A token is pruned ONLY on DeviceNotRegistered — never
 * on transient errors (rate/too-big/provider), mirroring the web-push rule of
 * pruning only 404/410. Delayed DeviceNotRegistered (via receipts) is a future
 * follow-up, not handled by this synchronous send.
 */
export function classifyExpoTicket(ticket: ExpoPushTicket): ExpoTicketOutcome {
  if (ticket.status === 'ok') return 'sent';
  return ticket.details?.error === 'DeviceNotRegistered' ? 'prune' : 'failed';
}
