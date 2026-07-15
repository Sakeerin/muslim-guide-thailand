import { eq, inArray } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { places } from '@/server/db/schema';
import type { HalalStatus } from '@/lib/validators/place';
import { isFourEyesRequired, nextReviewDate } from '@/lib/trust';
import { writeAudit } from './audit';

type VerificationMethod =
  | 'site_visit'
  | 'phone'
  | 'document'
  | 'official_registry'
  | 'owner_attestation';

export interface VerifyPlaceInput {
  placeId: string;
  halalStatus: HalalStatus;
  verificationMethod: VerificationMethod;
  actorId: string;
  actorRole?: string | null;
  /** publish now, or leave in review */
  publish?: boolean;
}

/**
 * Approve/verify a place: sets trust level + provenance and (optionally)
 * publishes it. 4-eyes rule for L1/L2 is enforced by the caller comparing
 * actorId against places.createdBy — a reviewer must differ from the author.
 */
export async function verifyPlace(input: VerifyPlaceInput) {
  const now = new Date();
  const [row] = await db
    .update(places)
    .set({
      halalStatus: input.halalStatus,
      verificationMethod: input.verificationMethod,
      verifiedBy: input.actorId,
      lastVerifiedAt: now,
      nextReviewDue: nextReviewDate(now),
      disputed: false,
      ...(input.publish ? { status: 'published' as const } : {}),
      updatedAt: now,
    })
    .where(eq(places.id, input.placeId))
    .returning({ id: places.id, status: places.status });

  await writeAudit({
    actorId: input.actorId,
    actorRole: input.actorRole,
    action: input.publish ? 'place.verify_publish' : 'place.verify',
    entityType: 'place',
    entityId: input.placeId,
    diff: { halalStatus: input.halalStatus, method: input.verificationMethod },
  });

  return row;
}

/** L1 (CICOT) and L2 (Muslim-owned) require review by someone other than the author. */
export async function canPublishAtLevel(
  placeId: string,
  actorId: string,
  level: HalalStatus,
): Promise<{ ok: boolean; reason?: string }> {
  if (!isFourEyesRequired(level)) return { ok: true };
  const place = await db.query.places.findFirst({ where: eq(places.id, placeId) });
  if (place?.createdBy && place.createdBy === actorId) {
    return { ok: false, reason: 'four_eyes' }; // author cannot approve their own L1/L2
  }
  return { ok: true };
}

export async function rejectPlace(placeId: string, actorId: string, note: string) {
  await db
    .update(places)
    .set({ status: 'draft', updatedAt: new Date() })
    .where(eq(places.id, placeId));
  await writeAudit({
    actorId,
    action: 'place.reject',
    entityType: 'place',
    entityId: placeId,
    diff: { note },
  });
}

/** Places awaiting review (drafts submitted for publishing). */
export async function listVerificationQueue() {
  return db
    .select({
      id: places.id,
      slug: places.slug,
      type: places.type,
      name: places.name,
      halalStatus: places.halalStatus,
      halalSource: places.halalSource,
      status: places.status,
      createdBy: places.createdBy,
      createdAt: places.createdAt,
    })
    .from(places)
    .where(inArray(places.status, ['pending_review']))
    .orderBy(places.createdAt);
}

/** Mark a place disputed (from a confidential halal-concern investigation). */
export async function setDisputed(placeId: string, disputed: boolean, actorId: string) {
  await db
    .update(places)
    .set({ disputed, updatedAt: new Date() })
    .where(eq(places.id, placeId));
  await writeAudit({
    actorId,
    action: disputed ? 'place.dispute' : 'place.undispute',
    entityType: 'place',
    entityId: placeId,
  });
}
