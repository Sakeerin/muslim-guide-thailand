import { and, desc, eq, inArray } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { places, submissions, user } from '@/server/db/schema';
import { OWNER_EDITABLE_FIELDS, type OwnerEditInput } from '@/lib/validators/claim';
import type { UpsertPlaceInput } from '@/lib/validators/place';
import { writeAudit } from './audit';

/** A logged-in user requests ownership of a place → claim submission. */
export async function createClaim(input: {
  placeId: string;
  userId: string;
  contact: string;
  message?: string;
}) {
  const [row] = await db
    .insert(submissions)
    .values({
      category: 'claim',
      placeId: input.placeId,
      submittedBy: input.userId,
      payload: { contact: input.contact, message: input.message ?? '' },
    })
    .returning({ id: submissions.id });
  return { id: row.id };
}

/** Places owned by a user (the merchant's portal list). */
export async function listMyPlaces(ownerId: string) {
  return db
    .select({
      id: places.id,
      slug: places.slug,
      name: places.name,
      type: places.type,
      status: places.status,
      halalStatus: places.halalStatus,
      featuredUntil: places.featuredUntil,
    })
    .from(places)
    .where(eq(places.ownerUserId, ownerId))
    .orderBy(desc(places.updatedAt));
}

export async function getOwnedPlace(placeId: string, ownerId: string) {
  return db.query.places.findFirst({
    where: and(eq(places.id, placeId), eq(places.ownerUserId, ownerId)),
  });
}

/** Staff approves a claim → sets the place owner to the claimant. */
export async function approveClaim(submissionId: string, actorId: string) {
  const submission = await db.query.submissions.findFirst({
    where: eq(submissions.id, submissionId),
  });
  if (!submission || submission.category !== 'claim' || !submission.placeId || !submission.submittedBy) {
    throw new Error('Invalid claim submission');
  }

  await db
    .update(places)
    .set({ ownerUserId: submission.submittedBy, updatedAt: new Date() })
    .where(eq(places.id, submission.placeId));

  await db
    .update(submissions)
    .set({ status: 'approved', resolvedAt: new Date(), resolution: 'ownership granted' })
    .where(eq(submissions.id, submissionId));

  await writeAudit({
    actorId,
    action: 'claim.approve',
    entityType: 'place',
    entityId: submission.placeId,
    diff: { ownerUserId: submission.submittedBy },
  });
}

/** Owner proposes changes → moderated place_edit submission (never a direct write). */
export async function submitOwnerEdit(input: OwnerEditInput, ownerId: string) {
  const owned = await getOwnedPlace(input.placeId, ownerId);
  if (!owned) throw new Error('Not the owner of this place');

  // keep only owner-editable fields (defence-in-depth over the schema)
  const payload: Record<string, unknown> = {};
  for (const key of OWNER_EDITABLE_FIELDS) {
    const v = (input as Record<string, unknown>)[key];
    if (v !== undefined) payload[key] = v;
  }

  const [row] = await db
    .insert(submissions)
    .values({
      category: 'place_edit',
      placeId: input.placeId,
      submittedBy: ownerId,
      payload,
    })
    .returning({ id: submissions.id });
  return { id: row.id };
}

/**
 * Staff applies an approved owner edit. Only owner-editable fields are written
 * (halal status/verification are never touched here).
 */
export async function applyOwnerEdit(submissionId: string, actorId: string) {
  const submission = await db.query.submissions.findFirst({
    where: eq(submissions.id, submissionId),
  });
  if (!submission || submission.category !== 'place_edit' || !submission.placeId) {
    throw new Error('Invalid place_edit submission');
  }

  const payload = submission.payload as Partial<UpsertPlaceInput>;
  const patch: Record<string, unknown> = { updatedAt: new Date() };
  for (const key of OWNER_EDITABLE_FIELDS) {
    if (payload[key as keyof UpsertPlaceInput] !== undefined) {
      patch[key] = payload[key as keyof UpsertPlaceInput];
    }
  }

  await db.update(places).set(patch).where(eq(places.id, submission.placeId));
  await db
    .update(submissions)
    .set({ status: 'approved', resolvedAt: new Date(), resolution: 'edit applied' })
    .where(eq(submissions.id, submissionId));

  await writeAudit({
    actorId,
    action: 'place.owner_edit_apply',
    entityType: 'place',
    entityId: submission.placeId,
    diff: patch,
  });
}

/** Open claim + edit submissions for the admin queue. */
export async function listOwnerSubmissions() {
  return db
    .select({
      id: submissions.id,
      category: submissions.category,
      placeId: submissions.placeId,
      payload: submissions.payload,
      createdAt: submissions.createdAt,
      submitterName: user.name,
      submitterEmail: user.email,
      placeName: places.name,
      placeSlug: places.slug,
    })
    .from(submissions)
    .leftJoin(user, eq(user.id, submissions.submittedBy))
    .leftJoin(places, eq(places.id, submissions.placeId))
    .where(
      and(
        inArray(submissions.category, ['claim', 'place_edit']),
        inArray(submissions.status, ['pending', 'in_review']),
      ),
    )
    .orderBy(desc(submissions.createdAt));
}
