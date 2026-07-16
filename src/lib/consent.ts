/**
 * PDPA consent constants. Bump CURRENT_POLICY_VERSION whenever the privacy
 * policy changes materially — consent is recorded against a version, and the
 * review gate requires consent at the current version.
 */
export const CONSENT_KEYS = ['privacy_policy', 'review_publication'] as const;
export type ConsentKey = (typeof CONSENT_KEYS)[number];

export const CURRENT_POLICY_VERSION = '2026-07-01';
