import { asc, eq, gt, inArray, sql } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { places } from '@/server/db/schema';
import { writeAudit } from './audit';

/**
 * Set/extend a sponsored placement. Staff-only; billing is handled offline —
 * this only sets the placement window. Featuring never changes halal status.
 */
export async function setFeatured(
  placeId: string,
  until: Date,
  note: string | null,
  actorId: string,
) {
  await db
    .update(places)
    .set({ featuredUntil: until, featuredNote: note, updatedAt: new Date() })
    .where(eq(places.id, placeId));
  await writeAudit({
    actorId,
    action: 'place.feature_set',
    entityType: 'place',
    entityId: placeId,
    diff: { until: until.toISOString(), note },
  });
}

export async function clearFeatured(placeId: string, actorId: string) {
  await db
    .update(places)
    .set({ featuredUntil: null, featuredNote: null, updatedAt: new Date() })
    .where(eq(places.id, placeId));
  await writeAudit({ actorId, action: 'place.feature_clear', entityType: 'place', entityId: placeId });
}

/** Currently-active sponsored placements (for the admin dashboard). */
export async function listActiveFeatured() {
  return db
    .select({
      id: places.id,
      slug: places.slug,
      name: places.name,
      type: places.type,
      halalStatus: places.halalStatus,
      featuredUntil: places.featuredUntil,
      featuredNote: places.featuredNote,
    })
    .from(places)
    .where(gt(places.featuredUntil, sql`now()`))
    .orderBy(asc(places.featuredUntil));
}

/** Publishable places for the "feature a place" picker. */
export async function listFeaturablePlaces() {
  return db
    .select({ id: places.id, slug: places.slug, name: places.name, type: places.type })
    .from(places)
    .where(inArray(places.status, ['published', 'published_unverified']))
    .orderBy(asc(places.slug))
    .limit(500);
}
