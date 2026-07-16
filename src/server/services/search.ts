import { db } from '@/server/db/client';
import { searchLogs } from '@/server/db/schema';
import { listPlaces, type PlaceListItem } from './places';
import type { ListPlacesQuery } from '@/lib/validators/place';
import { normalizeQuery, resolveSynonyms } from '@/lib/search-synonyms';

export interface SearchResult {
  items: PlaceListItem[];
  total: number;
  /** facets inferred from the text query (so the UI can reflect them) */
  inferred: { citySlug?: string; type?: string; categorySlug?: string };
}

/**
 * Text + facet search with cross-language synonym expansion and anonymous
 * zero-result logging. When the query text maps to a known facet (e.g.
 * "masjid" → mosques, "بانكوك" → Bangkok) and the caller hasn't set that
 * facet explicitly, we fill it in so ar/ms/id queries work before place
 * names are translated.
 */
export async function searchPlaces(
  query: ListPlacesQuery,
  locale: string,
): Promise<SearchResult> {
  const inferred: SearchResult['inferred'] = {};
  const effective: ListPlacesQuery = { ...query };

  if (query.q) {
    const hit = resolveSynonyms(query.q);
    if (hit.type && !effective.type) {
      effective.type = hit.type;
      inferred.type = hit.type;
    }
    if (hit.citySlug && !effective.city) {
      effective.city = hit.citySlug;
      inferred.citySlug = hit.citySlug;
    }
    if (hit.categorySlug && !effective.category) {
      effective.category = hit.categorySlug;
      inferred.categorySlug = hit.categorySlug;
    }
    // If the whole query was a facet word (e.g. just "masjid"), drop the
    // free-text match so it doesn't also filter by a non-existent name.
    if ((hit.type || hit.citySlug || hit.categorySlug) && isPureFacetQuery(query.q, hit)) {
      effective.q = undefined;
    }
  }

  const { items, total } = await listPlaces(effective);

  // fire-and-forget-safe: log the search for coverage analytics (no user link)
  await logSearch(query, locale, items.length).catch(() => {});

  return { items, total, inferred };
}

function isPureFacetQuery(q: string, hit: ReturnType<typeof resolveSynonyms>): boolean {
  const norm = normalizeQuery(q);
  // a query is "pure facet" if every word is a known facet term
  const facetWords = new Set(
    [hit.type, hit.citySlug, hit.categorySlug].filter(Boolean) as string[],
  );
  // heuristic: short single/double word queries that resolved fully
  return norm.split(' ').length <= 2 && facetWords.size > 0;
}

async function logSearch(query: ListPlacesQuery, locale: string, resultCount: number) {
  await db.insert(searchLogs).values({
    query: query.q ?? '',
    normalizedQuery: query.q ? normalizeQuery(query.q) : null,
    locale,
    city: query.city ?? null,
    resultCount,
  });
}

/** Admin insight: most frequent zero-result queries (coverage gaps). */
export async function topZeroResultQueries(days = 30, limit = 50) {
  return db.execute(
    // grouped by normalized query + locale
    `SELECT normalized_query, locale, count(*)::int AS hits
     FROM search_logs
     WHERE result_count = 0
       AND normalized_query IS NOT NULL
       AND created_at >= now() - interval '${days} days'
     GROUP BY normalized_query, locale
     ORDER BY hits DESC
     LIMIT ${limit}`,
  );
}
