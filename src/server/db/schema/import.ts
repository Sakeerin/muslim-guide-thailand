import {
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { placeTypeEnum } from './enums';
import { geographyPoint, type I18nText } from './types';
import { places } from './places';
import { user } from './auth';

export const importStatusEnum = pgEnum('import_status', [
  'pending', // awaiting staff review
  'imported', // promoted to a new place
  'merged', // linked to an existing place (duplicate)
  'rejected', // not useful / bad data
]);

/**
 * Staging layer for open-data ingest (OSM, GD Catalog, TAT, CICOT exports).
 * Nothing here is public — staff review each record and either promote it to
 * a new `places` row, merge it into an existing one, or reject it. Keeps the
 * public catalog curated and preserves per-source attribution (ODbL etc.).
 */
export const importRecords = pgTable(
  'import_records',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    source: text('source').notNull(), // 'osm' | 'gdcatalog' | 'tat' | 'cicot' | 'csv'
    sourceRef: text('source_ref').notNull(), // external id (e.g. osm node/123)
    placeType: placeTypeEnum('place_type').notNull(),
    name: jsonb('name').$type<I18nText>().notNull(),
    address: jsonb('address').$type<I18nText>().notNull().default({}),
    geog: geographyPoint('geog').notNull(),
    raw: jsonb('raw').notNull().default({}), // original payload for audit/re-mapping
    attribution: text('attribution'), // e.g. '© OpenStreetMap contributors (ODbL)'
    status: importStatusEnum('status').notNull().default('pending'),
    matchedPlaceId: uuid('matched_place_id').references(() => places.id, { onDelete: 'set null' }),
    reviewedBy: text('reviewed_by').references(() => user.id),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('import_source_ref_uq').on(t.source, t.sourceRef),
    index('import_pending').on(t.source, t.createdAt).where(sql`${t.status} = 'pending'`),
    index('import_geog_gist').using('gist', t.geog),
  ],
);
