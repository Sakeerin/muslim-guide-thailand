/**
 * Feature flags. EXPO_PUBLIC_* vars are inlined by Expo at build time, so this
 * is read once at bundle time — flipping it needs a rebuild, not a live toggle.
 *
 * Community UGC (reviews + Q&A) stays OFF until counsel signs off the
 * risk-keyword list. The server is the real authority (it returns 403
 * feature_disabled when off); this only hides the UI so we don't invite writes
 * that would bounce.
 */
export const COMMUNITY_UGC_ENABLED = process.env.EXPO_PUBLIC_COMMUNITY_UGC === 'on';
