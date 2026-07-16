/**
 * Cross-language search synonyms. Until place names are translated into
 * ar/ms/id, a search like "مطعم حلال" or "masjid" still needs to resolve to
 * the right category/city facet. This is a small curated map, not a full
 * translation layer — it covers the highest-frequency intent words.
 *
 * Matching is done on a normalized (lowercased, trimmed) token basis.
 */

export interface SynonymHit {
  categorySlug?: string;
  citySlug?: string;
  type?: 'restaurant' | 'mosque' | 'prayer_room' | 'attraction';
}

// term (normalized) → facet it should map to
const TERM_MAP: Record<string, SynonymHit> = {
  // mosques
  masjid: { type: 'mosque' },
  mosque: { type: 'mosque' },
  مسجد: { type: 'mosque' },
  มัสยิด: { type: 'mosque' },
  surau: { type: 'prayer_room' },
  musala: { type: 'prayer_room' },
  musholla: { type: 'prayer_room' },
  مصلى: { type: 'prayer_room' },
  'prayer room': { type: 'prayer_room' },
  'ห้องละหมาด': { type: 'prayer_room' },
  // halal food (generic → restaurant)
  halal: { type: 'restaurant' },
  حلال: { type: 'restaurant' },
  'makanan halal': { type: 'restaurant' },
  'makanan halal thailand': { type: 'restaurant' },
  restoran: { type: 'restaurant' },
  مطعم: { type: 'restaurant' },
  'مطعم حلال': { type: 'restaurant' },
  ร้านอาหาร: { type: 'restaurant' },
  // cuisines
  briyani: { categorySlug: 'biryani' },
  beriani: { categorySlug: 'biryani' },
  'nasi briyani': { categorySlug: 'biryani' },
  seafood: { categorySlug: 'seafood' },
  'makanan laut': { categorySlug: 'seafood' },
  // cities (romanized / arabic variants)
  bangkok: { citySlug: 'bangkok' },
  บางกอก: { citySlug: 'bangkok' },
  กรุงเทพ: { citySlug: 'bangkok' },
  بانكوك: { citySlug: 'bangkok' },
  phuket: { citySlug: 'phuket' },
  بوكيت: { citySlug: 'phuket' },
  krabi: { citySlug: 'krabi' },
  'chiang mai': { citySlug: 'chiang-mai' },
  pattaya: { citySlug: 'pattaya' },
  'hat yai': { citySlug: 'hat-yai' },
  hatyai: { citySlug: 'hat-yai' },
  ayutthaya: { citySlug: 'ayutthaya' },
};

export function normalizeQuery(q: string): string {
  return q.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Resolve a raw query into facet hints. A multi-word query is scanned for
 * any known term (whole-query first, then each word), so "masjid bangkok"
 * yields both {type:'mosque'} and {citySlug:'bangkok'}.
 */
export function resolveSynonyms(rawQuery: string): SynonymHit {
  const norm = normalizeQuery(rawQuery);
  const hit: SynonymHit = {};

  const apply = (h?: SynonymHit) => {
    if (!h) return;
    if (h.type && !hit.type) hit.type = h.type;
    if (h.categorySlug && !hit.categorySlug) hit.categorySlug = h.categorySlug;
    if (h.citySlug && !hit.citySlug) hit.citySlug = h.citySlug;
  };

  // whole-query match (catches multi-word keys like "prayer room")
  apply(TERM_MAP[norm]);

  // per-word match
  for (const word of norm.split(' ')) {
    apply(TERM_MAP[word]);
  }

  // two-word windows (e.g. "chiang mai", "hat yai", "makanan halal")
  const words = norm.split(' ');
  for (let i = 0; i < words.length - 1; i++) {
    apply(TERM_MAP[`${words[i]} ${words[i + 1]}`]);
  }

  return hit;
}
