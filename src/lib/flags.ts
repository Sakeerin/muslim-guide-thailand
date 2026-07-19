/**
 * Feature flags read from env. Kept tiny and server-side.
 *
 * Community UGC (reviews + Q&A) shares one legal gate: the risk-keyword list in
 * review-moderation.ts must be signed off by counsel before either goes live.
 * So it is OFF unless explicitly enabled, and the same flag gates both the
 * write APIs and the UI that renders them.
 */
export function communityUgcEnabled(): boolean {
  return process.env.COMMUNITY_UGC_ENABLED === 'on';
}
