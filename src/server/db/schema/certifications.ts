import { date, index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { certStatusEnum } from './enums';
import { places } from './places';
import { user } from './auth';

/**
 * Halal certification evidence (L1). Evidence files live in the PRIVATE
 * R2 bucket only. The platform shows certificate number + expiry + a photo
 * of the real certificate — never the CICOT mark itself (Criminal Code s.272-273).
 */
export const halalCertifications = pgTable(
  'halal_certifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    placeId: uuid('place_id')
      .notNull()
      .references(() => places.id, { onDelete: 'cascade' }),
    certifyingBody: text('certifying_body').notNull().default('CICOT'),
    certNumber: text('cert_number'),
    issuedAt: date('issued_at'),
    expiresAt: date('expires_at'),
    evidenceFileKey: text('evidence_file_key'), // private bucket only
    status: certStatusEnum('status').notNull().default('pending'),
    submittedBy: text('submitted_by').references(() => user.id),
    verifiedBy: text('verified_by').references(() => user.id),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('cert_expiry_idx').on(t.expiresAt).where(sql`${t.status} = 'verified'`),
    index('cert_place_idx').on(t.placeId),
  ],
);
