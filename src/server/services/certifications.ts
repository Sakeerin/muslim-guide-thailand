import { and, asc, eq, lte, sql } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { halalCertifications, places } from '@/server/db/schema';
import type { CreateCertificationInput } from '@/lib/validators/certification';
import { writeAudit } from './audit';

export async function listCertificationsForPlace(placeId: string) {
  return db
    .select()
    .from(halalCertifications)
    .where(eq(halalCertifications.placeId, placeId))
    .orderBy(asc(halalCertifications.expiresAt));
}

/** Certs awaiting review, with their place name/slug for the admin queue. */
export async function listPendingCertifications() {
  return db
    .select({
      id: halalCertifications.id,
      certifyingBody: halalCertifications.certifyingBody,
      certNumber: halalCertifications.certNumber,
      issuedAt: halalCertifications.issuedAt,
      expiresAt: halalCertifications.expiresAt,
      placeSlug: places.slug,
      placeName: places.name,
    })
    .from(halalCertifications)
    .innerJoin(places, eq(places.id, halalCertifications.placeId))
    .where(eq(halalCertifications.status, 'pending'))
    .orderBy(asc(halalCertifications.createdAt));
}

export async function createCertification(
  input: CreateCertificationInput,
  actorId: string,
) {
  const [row] = await db
    .insert(halalCertifications)
    .values({
      placeId: input.placeId,
      certifyingBody: input.certifyingBody,
      certNumber: input.certNumber ?? null,
      issuedAt: input.issuedAt ?? null,
      expiresAt: input.expiresAt ?? null,
      evidenceFileKey: input.evidenceFileKey ?? null,
      notes: input.notes ?? null,
      submittedBy: actorId,
      status: 'pending',
    })
    .returning({ id: halalCertifications.id });

  await writeAudit({
    actorId,
    action: 'cert.create',
    entityType: 'certification',
    entityId: row.id,
    diff: { placeId: input.placeId, certNumber: input.certNumber },
  });
  return row;
}

/**
 * Verify a certificate. Only verified certs are ever shown publicly
 * (Criminal Code s.272-273 safety). Verifying does NOT auto-set the place's
 * halal status — that stays an explicit reviewer decision (verifyPlace).
 */
export async function verifyCertification(certId: string, actorId: string) {
  const [row] = await db
    .update(halalCertifications)
    .set({ status: 'verified', verifiedBy: actorId, verifiedAt: new Date() })
    .where(eq(halalCertifications.id, certId))
    .returning({ id: halalCertifications.id, placeId: halalCertifications.placeId });

  await writeAudit({
    actorId,
    action: 'cert.verify',
    entityType: 'certification',
    entityId: certId,
    diff: { placeId: row?.placeId },
  });
  return row;
}

export async function rejectCertification(certId: string, actorId: string, note: string) {
  await db
    .update(halalCertifications)
    .set({ status: 'rejected', verifiedBy: actorId, verifiedAt: new Date(), notes: note })
    .where(eq(halalCertifications.id, certId));
  await writeAudit({
    actorId,
    action: 'cert.reject',
    entityType: 'certification',
    entityId: certId,
    diff: { note },
  });
}

export interface ExpiringCertRow {
  id: string;
  certNumber: string | null;
  expiresAt: string | null;
  placeId: string;
  placeSlug: string;
  placeName: Record<string, string>;
  daysLeft: number;
}

/** Verified certs expiring within `days` (buckets 30/60/90 in the UI). */
export async function listExpiringCertifications(days = 90): Promise<ExpiringCertRow[]> {
  const rows = await db
    .select({
      id: halalCertifications.id,
      certNumber: halalCertifications.certNumber,
      expiresAt: halalCertifications.expiresAt,
      placeId: places.id,
      placeSlug: places.slug,
      placeName: places.name,
      daysLeft: sql<number>`(${halalCertifications.expiresAt} - CURRENT_DATE)`,
    })
    .from(halalCertifications)
    .innerJoin(places, eq(places.id, halalCertifications.placeId))
    .where(
      and(
        eq(halalCertifications.status, 'verified'),
        sql`${halalCertifications.expiresAt} IS NOT NULL`,
        lte(halalCertifications.expiresAt, sql`CURRENT_DATE + ${days}::int`),
      ),
    )
    .orderBy(asc(halalCertifications.expiresAt));

  return rows.map((r) => ({
    ...r,
    placeName: r.placeName as Record<string, string>,
    daysLeft: Number(r.daysLeft),
  }));
}

/**
 * Expiry sweep (run daily by cron):
 * 1. mark verified certs whose expiry has passed as 'expired'
 * 2. downgrade any place that relied on those certs (cicot_certified with no
 *    remaining verified cert) to 'muslim_friendly' so the badge stops
 *    claiming an active certification.
 * Returns counts for alerting.
 */
export async function runExpirySweep(actorId = 'system') {
  // 1. expire lapsed certs
  const expired = await db
    .update(halalCertifications)
    .set({ status: 'expired' })
    .where(
      and(
        eq(halalCertifications.status, 'verified'),
        sql`${halalCertifications.expiresAt} < CURRENT_DATE`,
      ),
    )
    .returning({ id: halalCertifications.id, placeId: halalCertifications.placeId });

  // 2. downgrade places that no longer have any verified cert but still claim L1
  const affectedPlaceIds = [...new Set(expired.map((e) => e.placeId))];
  let downgraded = 0;
  for (const placeId of affectedPlaceIds) {
    const stillVerified = await db
      .select({ id: halalCertifications.id })
      .from(halalCertifications)
      .where(
        and(eq(halalCertifications.placeId, placeId), eq(halalCertifications.status, 'verified')),
      )
      .limit(1);
    if (stillVerified.length > 0) continue;

    const [row] = await db
      .update(places)
      .set({ halalStatus: 'muslim_friendly', disputed: false, updatedAt: new Date() })
      .where(and(eq(places.id, placeId), eq(places.halalStatus, 'cicot_certified')))
      .returning({ id: places.id });
    if (row) {
      downgraded++;
      await writeAudit({
        actorId,
        actorRole: 'system',
        action: 'place.cert_expired_downgrade',
        entityType: 'place',
        entityId: placeId,
        diff: { from: 'cicot_certified', to: 'muslim_friendly' },
      });
    }
  }

  return { expiredCerts: expired.length, downgradedPlaces: downgraded };
}
