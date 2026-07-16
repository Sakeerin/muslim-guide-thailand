import { describe, expect, it } from 'vitest';
import { normalizeQuery, resolveSynonyms } from '@/lib/search-synonyms';

describe('normalizeQuery', () => {
  it('lowercases, trims and collapses whitespace', () => {
    expect(normalizeQuery('  Halal   Food ')).toBe('halal food');
  });
});

describe('resolveSynonyms', () => {
  it('maps mosque terms across languages to the mosque type', () => {
    expect(resolveSynonyms('masjid').type).toBe('mosque');
    expect(resolveSynonyms('مسجد').type).toBe('mosque');
    expect(resolveSynonyms('มัสยิด').type).toBe('mosque');
  });

  it('maps prayer-room terms to prayer_room', () => {
    expect(resolveSynonyms('surau').type).toBe('prayer_room');
    expect(resolveSynonyms('musholla').type).toBe('prayer_room');
    expect(resolveSynonyms('prayer room').type).toBe('prayer_room');
  });

  it('maps halal/restaurant terms to restaurant', () => {
    expect(resolveSynonyms('halal').type).toBe('restaurant');
    expect(resolveSynonyms('مطعم حلال').type).toBe('restaurant');
  });

  it('maps Arabic and romanized city names to city slugs', () => {
    expect(resolveSynonyms('بانكوك').citySlug).toBe('bangkok');
    expect(resolveSynonyms('phuket').citySlug).toBe('phuket');
    expect(resolveSynonyms('hat yai').citySlug).toBe('hat-yai');
    expect(resolveSynonyms('chiang mai').citySlug).toBe('chiang-mai');
  });

  it('resolves multi-word queries into both type and city', () => {
    const hit = resolveSynonyms('masjid bangkok');
    expect(hit.type).toBe('mosque');
    expect(hit.citySlug).toBe('bangkok');
  });

  it('maps cuisine synonyms to category slugs', () => {
    expect(resolveSynonyms('nasi briyani').categorySlug).toBe('biryani');
    expect(resolveSynonyms('makanan laut').categorySlug).toBe('seafood');
  });

  it('returns an empty hit for unknown queries', () => {
    expect(resolveSynonyms('zzz random text')).toEqual({});
  });
});
