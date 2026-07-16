import { sql } from 'drizzle-orm';
import { bigint, index, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

/**
 * Anonymous search logging — no user link (PDPA data-minimization).
 * Zero-result rows are the key signal for where to add data next
 * (which city/locale/term is underserved).
 */
export const searchLogs = pgTable(
  'search_logs',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    query: text('query').notNull(),
    normalizedQuery: text('normalized_query'),
    locale: text('locale').notNull(),
    city: text('city'),
    resultCount: integer('result_count').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('search_logs_zero').on(t.createdAt).where(sql`${t.resultCount} = 0`),
    index('search_logs_created').on(t.createdAt),
  ],
);
