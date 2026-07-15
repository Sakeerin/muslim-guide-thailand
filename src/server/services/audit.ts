import { db } from '@/server/db/client';
import { auditLogs } from '@/server/db/schema';

/** Every admin mutation goes through here — no exceptions. */
export async function writeAudit(input: {
  actorId: string | null;
  actorRole?: string | null;
  action: string; // 'place.update' | 'submission.resolve' | 'takedown.hide' | ...
  entityType: string;
  entityId: string;
  diff?: unknown;
}) {
  await db.insert(auditLogs).values({
    actorId: input.actorId,
    actorRole: input.actorRole ?? null,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    diff: input.diff ?? null,
  });
}
