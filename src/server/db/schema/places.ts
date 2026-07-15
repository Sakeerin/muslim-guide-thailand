import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import {
  contentStatusEnum,
  halalSourceEnum,
  halalStatusEnum,
  placeTypeEnum,
  verificationMethodEnum,
} from './enums';
import { geographyPoint, type I18nText, type OpeningHours, type TranslationMeta } from './types';
import { cities, districts } from './geo';
import { user } from './auth';

export const places = pgTable(
  'places',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    type: placeTypeEnum('type').notNull(),
    slug: text('slug').notNull().unique(), // latin, shared across locales
    name: jsonb('name').$type<I18nText>().notNull(),
    description: jsonb('description').$type<I18nText>().notNull().default({}),
    address: jsonb('address').$type<I18nText>().notNull().default({}),
    cityId: uuid('city_id').references(() => cities.id),
    districtId: uuid('district_id').references(() => districts.id),
    geog: geographyPoint('geog').notNull(),

    phone: text('phone'),
    website: text('website'),
    lineId: text('line_id'),
    googleMapsUrl: text('google_maps_url'),
    openingHours: jsonb('opening_hours').$type<OpeningHours>(),
    priceRange: smallint('price_range'), // 1-4

    halalStatus: halalStatusEnum('halal_status').notNull().default('unverified'),
    halalSource: halalSourceEnum('halal_source').notNull().default('none'),
    servesAlcohol: boolean('serves_alcohol'), // null = unknown; never guessed
    // per-type extras: mosque {women_section,wudu,jumuah_time}, prayer_room {venue,floor,...}
    attributes: jsonb('attributes').notNull().default({}),

    avgRating: numeric('avg_rating', { precision: 3, scale: 2 }),
    reviewCount: integer('review_count').notNull().default(0),

    status: contentStatusEnum('status').notNull().default('draft'),
    // 'admin' | 'osm' | 'tat' | 'gdcatalog' | 'owner' | 'user'
    dataSource: text('data_source').notNull().default('admin'),
    sourceRef: text('source_ref'), // osm node id etc. — ODbL attribution
    translationMeta: jsonb('translation_meta').$type<TranslationMeta>().notNull().default({}),

    // Verification ops — the heart of the trust system
    lastVerifiedAt: timestamp('last_verified_at', { withTimezone: true }),
    verificationMethod: verificationMethodEnum('verification_method'),
    verifiedBy: text('verified_by').references(() => user.id),
    nextReviewDue: timestamp('next_review_due', { withTimezone: true }),
    // while disputed, public UI shows "under re-verification" — never the accusation
    disputed: boolean('disputed').notNull().default(false),

    ownerUserId: text('owner_user_id').references(() => user.id), // Phase 2 claim
    createdBy: text('created_by').references(() => user.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('places_geog_gist').using('gist', t.geog),
    index('places_city_type')
      .on(t.cityId, t.type)
      .where(sql`${t.status} IN ('published','published_unverified')`),
    index('places_halal')
      .on(t.halalStatus)
      .where(sql`${t.status} IN ('published','published_unverified')`),
    index('places_review_due').on(t.nextReviewDue),
    index('places_name_th_trgm').using('gin', sql`(${t.name}->>'th') gin_trgm_ops`),
    index('places_name_en_trgm').using('gin', sql`(${t.name}->>'en') gin_trgm_ops`),
    index('places_attrs_gin').using('gin', sql`${t.attributes} jsonb_path_ops`),
  ],
);
