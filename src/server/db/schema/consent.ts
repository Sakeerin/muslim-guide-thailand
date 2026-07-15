import {
  bigint,
  boolean,
  date,
  inet,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { user } from './auth';
import { places } from './places';

/** PDPA: granular consent log for registered users (Phase 2 public accounts). */
export const consentLogs = pgTable('consent_logs', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  consentKey: text('consent_key').notNull(), // 'geolocation' | 'marketing' | ...
  granted: boolean('granted').notNull(),
  policyVersion: text('policy_version').notNull(),
  ip: inet('ip'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * PDPA consent from business owners during field verification — they are
 * NOT users of the system, so this cannot live in consent_logs.
 * Photos/data collected without a row here are a compliance risk.
 */
export const fieldConsents = pgTable('field_consents', {
  id: uuid('id').primaryKey().defaultRandom(),
  placeId: uuid('place_id')
    .notNull()
    .references(() => places.id, { onDelete: 'cascade' }),
  consenterName: text('consenter_name').notNull(),
  consenterRole: text('consenter_role'), // owner | manager | staff
  scope: text('scope').notNull(), // 'photos,listing_data,certificate_photo'
  evidenceFileKey: text('evidence_file_key'), // signed form / in-app confirmation
  collectedBy: text('collected_by').references(() => user.id),
  consentDate: date('consent_date').notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
