/**
 * Sponsored/featured placement (B2B). A place is featured while its
 * `featured_until` is in the future. Featuring is a paid *placement*, set by
 * staff (billing is offline — the app never collects payment). It is
 * orthogonal to halal trust: a featured place still shows its real halal
 * status, and being featured never implies any endorsement — the UI always
 * labels it "Sponsored".
 */
export function isFeatured(featuredUntil: Date | string | null | undefined, now: Date = new Date()): boolean {
  if (!featuredUntil) return false;
  const until = typeof featuredUntil === 'string' ? new Date(featuredUntil) : featuredUntil;
  return until.getTime() > now.getTime();
}
