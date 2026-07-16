import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { contentStatusEnum, reviewStatusEnum } from './enums';
import { places } from './places';
import { user } from './auth';
import type { I18nText } from './types';

/**
 * Reviews (Phase 2). Hybrid moderation: risk-flagged text requires manual
 * approval (criminal defamation risk under Thai law).
 * ONE active review per (user, place) — a returning visitor updates their
 * review (upsert) rather than stacking, which also closes the rating-
 * manipulation vector of repeated submissions.
 */
export const reviews = pgTable(
  'reviews',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    placeId: uuid('place_id')
      .notNull()
      .references(() => places.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id),
    rating: smallint('rating').notNull(),
    body: text('body'),
    lang: text('lang'),
    status: reviewStatusEnum('status').notNull().default('pending'),
    riskFlag: boolean('risk_flag').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('reviews_place_user_uq').on(t.placeId, t.userId),
    index('reviews_place_idx').on(t.placeId, t.status, t.createdAt),
    index('reviews_mod_queue').on(t.createdAt).where(sql`${t.status} = 'pending'`),
  ],
);

export const media = pgTable('media', {
  id: uuid('id').primaryKey().defaultRandom(),
  placeId: uuid('place_id').references(() => places.id, { onDelete: 'cascade' }),
  reviewId: uuid('review_id').references(() => reviews.id, { onDelete: 'set null' }),
  r2Key: text('r2_key').notNull(),
  kind: text('kind').notNull().default('photo'), // photo | menu | storefront
  width: integer('width'),
  height: integer('height'),
  blurHash: text('blur_hash'),
  alt: jsonb('alt').$type<I18nText>().notNull().default({}),
  attribution: text('attribution'), // photographer / source credit
  sortOrder: integer('sort_order').notNull().default(0),
  status: contentStatusEnum('status').notNull().default('published'),
  uploadedBy: text('uploaded_by').references(() => user.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
