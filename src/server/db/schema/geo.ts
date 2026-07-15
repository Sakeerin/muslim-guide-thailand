import { boolean, integer, jsonb, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { geographyPoint, type I18nText } from './types';

export const cities = pgTable('cities', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(), // 'bangkok', 'phuket', ...
  name: jsonb('name').$type<I18nText>().notNull(),
  description: jsonb('description').$type<I18nText>().notNull().default({}),
  provinceCode: text('province_code').notNull(), // joins prayer_times_official
  center: geographyPoint('center').notNull(),
  heroMediaKey: text('hero_media_key'),
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
});

// Districts power the neighbourhood SEO pages (/bangkok/sukhumvit) —
// Bangkok-only in MVP, other cities later.
export const districts = pgTable('districts', {
  id: uuid('id').primaryKey().defaultRandom(),
  cityId: uuid('city_id')
    .notNull()
    .references(() => cities.id, { onDelete: 'cascade' }),
  slug: text('slug').notNull(),
  name: jsonb('name').$type<I18nText>().notNull(),
  description: jsonb('description').$type<I18nText>().notNull().default({}),
  heroMediaKey: text('hero_media_key'),
  sortOrder: integer('sort_order').notNull().default(0),
});
