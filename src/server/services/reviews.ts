import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { consentLogs, places, reviews, user } from '@/server/db/schema';
import { decideReviewStatus, screenReview } from '@/lib/review-moderation';
import { CURRENT_POLICY_VERSION } from '@/lib/consent';
import { writeAudit } from './audit';

/** PDPA gate: a user must have granted review_publication consent (current
 *  policy version) before any review of theirs can be created/published. */
export async function hasReviewConsent(userId: string): Promise<boolean> {
  const rows = await db
    .select({ id: consentLogs.id })
    .from(consentLogs)
    .where(
      and(
        eq(consentLogs.userId, userId),
        eq(consentLogs.consentKey, 'review_publication'),
        eq(consentLogs.granted, true),
        eq(consentLogs.policyVersion, CURRENT_POLICY_VERSION),
      ),
    )
    .limit(1);
  return rows.length > 0;
}

export interface CreateReviewInput {
  placeId: string;
  userId: string;
  rating: number;
  body?: string | null;
  lang?: string | null;
}

export interface CreateReviewResult {
  id: string;
  status: 'published' | 'pending';
}

/**
 * Recompute a place's published-review aggregates atomically. Single
 * UPDATE...FROM(subquery) so concurrent inserts/moderation can't lose an
 * update (no read-then-write race).
 */
export async function recalcPlaceRating(placeId: string) {
  await db.execute(sql`
    UPDATE places p SET
      avg_rating = agg.avg,
      review_count = agg.cnt,
      updated_at = now()
    FROM (
      SELECT
        ROUND(AVG(rating)::numeric, 2) AS avg,
        COUNT(*)::int AS cnt
      FROM reviews
      WHERE place_id = ${placeId} AND status = 'published'
    ) AS agg
    WHERE p.id = ${placeId}
  `);
}

/**
 * Create a review with the defamation-safe hybrid moderation policy.
 * Star-only → published; clean text from an established account → published;
 * risk-flagged text or brand-new accounts → pending (held for a moderator).
 */
export async function createReview(input: CreateReviewInput): Promise<CreateReviewResult> {
  const body = input.body?.trim() || null;
  const { riskFlag } = screenReview(body);

  const account = await db.query.user.findFirst({ where: eq(user.id, input.userId) });
  const accountAgeMs = account ? Date.now() - account.createdAt.getTime() : 0;

  const status = decideReviewStatus({ hasBody: Boolean(body), riskFlag, accountAgeMs });

  // one review per (user, place): a returning visitor updates their review
  // instead of stacking (also closes the repeat-submission manipulation vector)
  const [row] = await db
    .insert(reviews)
    .values({
      placeId: input.placeId,
      userId: input.userId,
      rating: input.rating,
      body,
      lang: input.lang ?? null,
      status,
      riskFlag,
    })
    .onConflictDoUpdate({
      target: [reviews.placeId, reviews.userId],
      set: { rating: input.rating, body, lang: input.lang ?? null, status, riskFlag, updatedAt: new Date() },
    })
    .returning({ id: reviews.id });

  // recalc whether it published or was updated/removed from published
  await recalcPlaceRating(input.placeId);

  return { id: row.id, status };
}

/** Published reviews for a place, newest first, with author display name. */
export async function listPublishedReviews(placeId: string, limit = 30) {
  return db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      body: reviews.body,
      lang: reviews.lang,
      createdAt: reviews.createdAt,
      authorName: user.name,
    })
    .from(reviews)
    .innerJoin(user, eq(user.id, reviews.userId))
    .where(and(eq(reviews.placeId, placeId), eq(reviews.status, 'published')))
    .orderBy(desc(reviews.createdAt))
    .limit(limit);
}

/** A user's own reviews (any status), with place name/slug. */
export async function listReviewsByUser(userId: string) {
  return db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      body: reviews.body,
      status: reviews.status,
      createdAt: reviews.createdAt,
      placeSlug: places.slug,
      placeName: places.name,
    })
    .from(reviews)
    .innerJoin(places, eq(places.id, reviews.placeId))
    .where(eq(reviews.userId, userId))
    .orderBy(desc(reviews.createdAt));
}

// ── moderation ──────────────────────────────────────────────────────────────

/** Pending reviews for the admin queue (risk-flagged surfaced first). */
export async function listPendingReviews(limit = 100) {
  return db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      body: reviews.body,
      lang: reviews.lang,
      riskFlag: reviews.riskFlag,
      createdAt: reviews.createdAt,
      authorName: user.name,
      placeSlug: places.slug,
      placeName: places.name,
    })
    .from(reviews)
    .innerJoin(user, eq(user.id, reviews.userId))
    .innerJoin(places, eq(places.id, reviews.placeId))
    .where(eq(reviews.status, 'pending'))
    .orderBy(desc(reviews.riskFlag), desc(reviews.createdAt))
    .limit(limit);
}

async function setReviewStatus(
  id: string,
  status: 'published' | 'hidden' | 'removed',
  actorId: string,
  action: string,
) {
  const [row] = await db
    .update(reviews)
    .set({ status })
    .where(eq(reviews.id, id))
    .returning({ placeId: reviews.placeId });
  if (row) await recalcPlaceRating(row.placeId);
  await writeAudit({ actorId, action, entityType: 'review', entityId: id });
}

export const approveReview = (id: string, actorId: string) =>
  setReviewStatus(id, 'published', actorId, 'review.approve');
export const hideReview = (id: string, actorId: string) =>
  setReviewStatus(id, 'hidden', actorId, 'review.hide');
export const removeReview = (id: string, actorId: string) =>
  setReviewStatus(id, 'removed', actorId, 'review.remove');
