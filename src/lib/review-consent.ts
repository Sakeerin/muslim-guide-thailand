/**
 * PDPA consents recorded before a signed-in user's review or Q&A post can be
 * published — mirrors the register flow and the native REVIEW_CONSENTS
 * (mobile/src/lib/api/reviews.ts). Publishing reveals the author publicly, so
 * review_publication is required.
 */
export const REVIEW_CONSENTS = ['privacy_policy', 'review_publication'] as const;

/**
 * Record review-publication consent for the signed-in user. Throws on failure so
 * the caller can keep the user on the form instead of losing their draft.
 */
export async function recordReviewConsent(): Promise<void> {
  const res = await fetch('/api/v1/account/consent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ consents: [...REVIEW_CONSENTS] }),
  });
  if (!res.ok) throw new Error('consent_failed');
}
