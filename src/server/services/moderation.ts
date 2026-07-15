import { and, asc, count, desc, eq, inArray, isNull, sql } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { places, submissions, takedownRequests } from '@/server/db/schema';
import { writeAudit } from './audit';

/** Hours until the SLA deadline, computed against server time in the service
 *  (keeps server components pure — no Date.now() during render). */
function withHoursLeft<T extends { slaDeadlineAt: Date }>(rows: T[], nowMs: number) {
  return rows.map((r) => ({
    ...r,
    hoursLeft: Math.round(((r.slaDeadlineAt.getTime() - nowMs) / 36e5) * 10) / 10,
  }));
}

export async function dashboardStats() {
  const nowMs = Date.now();
  const [placesByStatus, pendingSubmissions, openTakedowns] = await Promise.all([
    db
      .select({ status: places.status, count: count() })
      .from(places)
      .groupBy(places.status),
    db
      .select({ count: count() })
      .from(submissions)
      .where(inArray(submissions.status, ['pending', 'in_review'])),
    db
      .select()
      .from(takedownRequests)
      .where(inArray(takedownRequests.status, ['received', 'in_review']))
      .orderBy(asc(takedownRequests.slaDeadlineAt)),
  ]);

  return {
    placesByStatus,
    pendingSubmissionCount: pendingSubmissions[0]?.count ?? 0,
    openTakedowns: withHoursLeft(openTakedowns, nowMs),
    nearestTakedownDeadline: openTakedowns[0]?.slaDeadlineAt ?? null,
  };
}

export async function listSubmissionQueue() {
  return db
    .select()
    .from(submissions)
    .where(inArray(submissions.status, ['pending', 'in_review']))
    .orderBy(asc(submissions.createdAt))
    .limit(100);
}

export async function acknowledgeSubmission(id: string, actorId: string) {
  await db
    .update(submissions)
    .set({ status: 'in_review', assigneeId: actorId, acknowledgedAt: new Date() })
    .where(and(eq(submissions.id, id), isNull(submissions.acknowledgedAt)));
  await writeAudit({
    actorId,
    action: 'submission.acknowledge',
    entityType: 'submission',
    entityId: id,
  });
}

export async function resolveSubmission(
  id: string,
  actorId: string,
  outcome: 'approved' | 'rejected',
  resolution: string,
) {
  await db
    .update(submissions)
    .set({ status: outcome, resolvedAt: new Date(), resolution })
    .where(eq(submissions.id, id));
  await writeAudit({
    actorId,
    action: `submission.${outcome}`,
    entityType: 'submission',
    entityId: id,
    diff: { resolution },
  });
}

/** Public takedown intake (MDES). SLA deadline = received + 24h, computed here. */
export async function createTakedownRequest(input: {
  contentType: 'place' | 'media' | 'review';
  contentId: string;
  requesterName?: string;
  requesterContact: string;
  reason: string;
  legalReference?: string;
}) {
  const receivedAt = new Date();
  const slaDeadlineAt = new Date(receivedAt.getTime() + 24 * 60 * 60 * 1000);
  const [row] = await db
    .insert(takedownRequests)
    .values({
      contentType: input.contentType,
      contentId: input.contentId,
      requesterName: input.requesterName ?? null,
      requesterContact: input.requesterContact,
      reason: input.reason,
      legalReference: input.legalReference ?? null,
      receivedAt,
      slaDeadlineAt,
    })
    .returning({ id: takedownRequests.id });
  return row;
}

export async function listOpenTakedowns() {
  const nowMs = Date.now();
  const rows = await db
    .select()
    .from(takedownRequests)
    .where(inArray(takedownRequests.status, ['received', 'in_review']))
    .orderBy(asc(takedownRequests.slaDeadlineAt));
  return withHoursLeft(rows, nowMs);
}

/**
 * "Hide immediately" — reversible suspension of the content, the default
 * action when a takedown cannot be adjudicated before the 24h deadline.
 */
export async function hideTakedownContent(id: string, actorId: string) {
  const request = await db.query.takedownRequests.findFirst({
    where: eq(takedownRequests.id, id),
  });
  if (!request) throw new Error('Takedown request not found');

  if (request.contentType === 'place') {
    await db
      .update(places)
      .set({ status: 'removed', updatedAt: new Date() })
      .where(eq(places.id, request.contentId));
  }
  // media/review hiding lands with Phase 2 UGC

  await db
    .update(takedownRequests)
    .set({
      status: 'content_hidden',
      actionTaken: 'content hidden (reversible suspension)',
      actionedAt: new Date(),
      handledBy: actorId,
    })
    .where(eq(takedownRequests.id, id));

  await writeAudit({
    actorId,
    action: 'takedown.hide',
    entityType: request.contentType,
    entityId: request.contentId,
    diff: { takedownId: id },
  });
}

export async function listAllPlacesForAdmin() {
  return db
    .select({
      id: places.id,
      slug: places.slug,
      type: places.type,
      name: places.name,
      halalStatus: places.halalStatus,
      status: places.status,
      dataSource: places.dataSource,
      lastVerifiedAt: places.lastVerifiedAt,
      updatedAt: places.updatedAt,
    })
    .from(places)
    .orderBy(desc(places.updatedAt))
    .limit(200);
}

/** Certificates expiring within N days — feeds the expiry dashboard + cron. */
export async function expiringCertificates(days = 30) {
  return db.execute(sql`
    SELECT hc.id, hc.cert_number, hc.expires_at, p.slug, p.name
    FROM halal_certifications hc
    JOIN places p ON p.id = hc.place_id
    WHERE hc.status = 'verified'
      AND hc.expires_at IS NOT NULL
      AND hc.expires_at <= (CURRENT_DATE + ${days}::int)
    ORDER BY hc.expires_at ASC
  `);
}
