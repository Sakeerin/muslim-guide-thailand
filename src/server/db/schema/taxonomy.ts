import {
  boolean,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  uuid,
} from 'drizzle-orm/pg-core';
import { placeTypeEnum } from './enums';
import type { I18nText } from './types';
import { places } from './places';

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  name: jsonb('name').$type<I18nText>().notNull(),
  placeType: placeTypeEnum('place_type').notNull(),
  parentId: uuid('parent_id'),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const placeCategories = pgTable(
  'place_categories',
  {
    placeId: uuid('place_id')
      .notNull()
      .references(() => places.id, { onDelete: 'cascade' }),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.placeId, t.categoryId] })],
);

export const amenities = pgTable('amenities', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: text('key').notNull().unique(), // prayer_room, wudu, bidet_spray, ...
  name: jsonb('name').$type<I18nText>().notNull(),
  icon: text('icon'),
  appliesTo: placeTypeEnum('applies_to').array().notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const placeAmenities = pgTable(
  'place_amenities',
  {
    placeId: uuid('place_id')
      .notNull()
      .references(() => places.id, { onDelete: 'cascade' }),
    amenityId: uuid('amenity_id')
      .notNull()
      .references(() => amenities.id, { onDelete: 'cascade' }),
    // true = has it, false = confirmed absent; unknown amenities simply have no row
    value: boolean('value').notNull().default(true),
    // e.g. prayer room: {"floor":"3","gender_separated":true,"wudu":true}
    detail: jsonb('detail'),
  },
  (t) => [primaryKey({ columns: [t.placeId, t.amenityId] })],
);
