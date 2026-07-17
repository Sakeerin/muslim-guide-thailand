import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { user } from './auth';

/**
 * Web Push subscriptions (browser PushManager). Anonymous by design: core
 * features work without login, so `userId` is nullable — a subscription is
 * keyed by its `endpoint` (the natural key the browser gives us). If the user
 * happens to be signed in when they opt in, we link the row so the PDPA
 * right-to-erasure cascade removes their subscriptions with the account.
 *
 * Consent: the browser Notification grant + an explicit opt-in tap IS the PDPA
 * opt-in for anonymous subscribers (consent_logs requires a user_id, so it
 * can't record them). We store the policy version + timestamp on the row as
 * consent evidence. For signed-in users we ALSO mirror a consent_logs entry.
 */
export const pushSubscriptions = pgTable('push_subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  // nullable = anonymous subscriber; onDelete cascade for PDPA erasure
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  // endpoint is long and provider-specific → text + UNIQUE for upsert
  endpoint: text('endpoint').notNull().unique(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  // preferred language for the notification body (falls back to 'en')
  locale: text('locale'),
  // announcement topics this device opted into, e.g. ['ramadan','eid']
  topics: text('topics').array(),
  userAgent: text('user_agent'),
  // PDPA consent evidence for anonymous subscribers
  consentPolicyVersion: text('consent_policy_version').notNull(),
  consentedAt: timestamp('consented_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
});
