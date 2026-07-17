/**
 * PDPA consent constants. Bump CURRENT_POLICY_VERSION whenever the privacy
 * policy changes materially — consent is recorded against a version, and the
 * review gate requires consent at the current version.
 */
export const CONSENT_KEYS = [
  'privacy_policy',
  'review_publication',
  // Web Push opt-in. Anonymous subscribers can't be recorded in consent_logs
  // (it requires a user_id) — their consent lives on the push_subscriptions
  // row; this key is only used to mirror an audit entry for signed-in users.
  'push_notifications',
] as const;
export type ConsentKey = (typeof CONSENT_KEYS)[number];

export const CURRENT_POLICY_VERSION = '2026-07-01';
