import { describe, expect, it } from 'vitest';
import {
  dedupeKey,
  isLikelyDuplicate,
  MATCH,
  normalizePlaceName,
} from '@/lib/import-match';

describe('normalizePlaceName', () => {
  it('drops generic type prefixes and normalizes spacing', () => {
    expect(normalizePlaceName('มัสยิด นูรุลอิสลาม')).toBe('นูรุลอิสลาม');
    expect(normalizePlaceName('Masjid  Nurul  Islam')).toBe('nurul islam');
    expect(normalizePlaceName('مسجد النور')).toBe('النور');
  });

  it('keeps the name when it is only a generic word', () => {
    expect(normalizePlaceName('มัสยิด')).toBe('มัสยิด');
  });

  it('is stable across full-width / zero-width / case', () => {
    expect(normalizePlaceName('ＮＵＲ​UL')).toBe(normalizePlaceName('nurul'));
  });
});

describe('dedupeKey', () => {
  it('collapses spacing so equivalent names share a key', () => {
    expect(dedupeKey('Masjid Nurul Islam')).toBe(dedupeKey('  nurul   islam '));
  });
});

describe('isLikelyDuplicate', () => {
  it('flags anything essentially on the same spot', () => {
    expect(isLikelyDuplicate({ distanceM: 10, nameSimilarity: 0 })).toBe(true);
  });
  it('flags near + strong name match', () => {
    expect(isLikelyDuplicate({ distanceM: 100, nameSimilarity: 0.7 })).toBe(true);
  });
  it('does not flag near + weak name match', () => {
    expect(isLikelyDuplicate({ distanceM: 100, nameSimilarity: 0.3 })).toBe(false);
  });
  it('does not flag far even with identical name', () => {
    expect(isLikelyDuplicate({ distanceM: MATCH.nearMeters + 1, nameSimilarity: 1 })).toBe(false);
  });
});
