import type { I18nText } from '@/server/db/schema/types';
import { resolveI18n } from '@/lib/i18n-content';

/**
 * Shared Web Push helpers — pure and environment-agnostic (no web-push, no DOM
 * side effects at module scope) so the client component, the server sender,
 * and unit tests can all import them.
 */

/** Announcement topics a device can subscribe to. */
export const PUSH_TOPICS = ['ramadan', 'eid', 'events'] as const;
export type PushTopic = (typeof PUSH_TOPICS)[number];

export function isPushTopic(value: unknown): value is PushTopic {
  return typeof value === 'string' && (PUSH_TOPICS as readonly string[]).includes(value);
}

/**
 * Convert a URL-safe base64 VAPID public key into the Uint8Array that
 * PushManager.subscribe({ applicationServerKey }) requires — browsers reject
 * the raw string.
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  // back with a concrete ArrayBuffer so the result is a valid BufferSource for
  // PushManager.subscribe({ applicationServerKey })
  const output = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

/** A subscription endpoint is dead (should be pruned) on 404/410 from the push service. */
export function isExpiredPushStatus(statusCode: number | undefined): boolean {
  return statusCode === 404 || statusCode === 410;
}

/**
 * Whether a caught sendNotification error means the subscription is gone and
 * should be deleted. True only when the error carries a 404/410 statusCode
 * (web-push's WebPushError contract) — never for transient network/5xx errors,
 * so we never delete a still-valid subscription. Deliberately structural (not
 * `instanceof`) to survive duplicate-module / bundling identity pitfalls.
 */
export function shouldPrunePushError(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) return false;
  const status = (err as { statusCode?: unknown }).statusCode;
  return typeof status === 'number' && isExpiredPushStatus(status);
}

/** Multilingual announcement content (JSONB i18n title/body). */
export interface AnnouncementContent {
  title: I18nText;
  body: I18nText;
  /** in-app path to open on click, e.g. "/ramadan" (locale prefix added per-subscriber) */
  path?: string;
  icon?: string;
  /** collapse tag so repeat announcements replace rather than stack */
  tag?: string;
}

/** The JSON payload the service worker's `push` handler expects. */
export interface PushPayload {
  title: string;
  body: string;
  url: string;
  icon?: string;
  tag?: string;
  lang: string;
}

/**
 * Build a per-subscriber payload: resolve the localized title/body and prefix
 * the click URL with the subscriber's locale so it lands on the right language.
 */
export function buildAnnouncementPayload(
  content: AnnouncementContent,
  locale: string,
): PushPayload {
  const lang = locale || 'en';
  const path = content.path ?? '/';
  const url = `/${lang}${path.startsWith('/') ? path : `/${path}`}`;
  return {
    title: resolveI18n(content.title, lang),
    body: resolveI18n(content.body, lang),
    url,
    icon: content.icon,
    tag: content.tag,
    lang,
  };
}
