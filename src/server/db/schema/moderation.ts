import {
  bigint,
  boolean,
  index,
  inet,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { submissionCategoryEnum, submissionStatusEnum, takedownStatusEnum } from './enums';
import { places } from './places';
import { user } from './auth';

/**
 * Unified inbound queue: new places, edits, user reports, claims.
 * halal_concern reports are confidential (is_confidential) — investigated
 * silently, never published (defamation-safe design).
 * Real columns (not jsonb) for everything the queue filters/sorts on.
 */
export const submissions = pgTable(
  'submissions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    category: submissionCategoryEnum('category').notNull(),
    placeId: uuid('place_id').references(() => places.id, { onDelete: 'set null' }),
    payload: jsonb('payload').notNull(), // proposed data / report details / evidence keys
    reporterContact: text('reporter_contact'), // optional, for follow-up only
    isConfidential: boolean('is_confidential').notNull().default(false),
    submittedBy: text('submitted_by').references(() => user.id), // null = anonymous public form
    status: submissionStatusEnum('status').notNull().default('pending'),
    assigneeId: text('assignee_id').references(() => user.id),
    acknowledgedAt: timestamp('acknowledged_at', { withTimezone: true }),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    resolution: text('resolution'),
    reviewNote: text('review_note'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('submissions_queue')
      .on(t.status, t.category, t.createdAt)
      .where(sql`${t.status} IN ('pending','in_review')`),
    index('submissions_assignee').on(t.assigneeId).where(sql`${t.resolvedAt} IS NULL`),
    index('submissions_place').on(t.placeId),
  ],
);

/**
 * MDES notice-and-takedown: the 24h SLA lives in the database.
 * Cron alerts at 12h/20h before sla_deadline_at. Default action when
 * undecided at deadline: hide (suspend), never silently ignore.
 */
export const takedownRequests = pgTable(
  'takedown_requests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    contentType: text('content_type').notNull(), // 'place' | 'media' | 'review'
    contentId: uuid('content_id').notNull(),
    requesterName: text('requester_name'),
    requesterContact: text('requester_contact').notNull(),
    reason: text('reason').notNull(),
    legalReference: text('legal_reference'),
    receivedAt: timestamp('received_at', { withTimezone: true }).notNull().defaultNow(),
    slaDeadlineAt: timestamp('sla_deadline_at', { withTimezone: true }).notNull(),
    acknowledgedAt: timestamp('acknowledged_at', { withTimezone: true }),
    status: takedownStatusEnum('status').notNull().default('received'),
    actionTaken: text('action_taken'),
    actionedAt: timestamp('actioned_at', { withTimezone: true }),
    handledBy: text('handled_by').references(() => user.id),
  },
  (t) => [
    index('takedown_open')
      .on(t.slaDeadlineAt)
      .where(sql`${t.status} IN ('received','in_review')`),
    index('takedown_content').on(t.contentType, t.contentId),
  ],
);

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    actorId: text('actor_id'),
    actorRole: text('actor_role'),
    action: text('action').notNull(), // 'place.update', 'cert.verify', 'takedown.hide', ...
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id').notNull(),
    diff: jsonb('diff'),
    ip: inet('ip'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('audit_entity').on(t.entityType, t.entityId, t.createdAt)],
);
