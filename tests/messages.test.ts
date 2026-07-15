import { describe, expect, it } from 'vitest';
import en from '../messages/en.json';
import th from '../messages/th.json';
import ms from '../messages/ms.json';
import id from '../messages/id.json';
import ar from '../messages/ar.json';

type Json = Record<string, unknown>;

/** Flatten nested keys to dotted paths so we can compare key sets. */
function keyPaths(obj: Json, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) => {
    const path = prefix ? `${prefix}.${k}` : k;
    return v !== null && typeof v === 'object'
      ? keyPaths(v as Json, path)
      : [path];
  });
}

const en_ = keyPaths(en as Json).sort();

describe('message catalogs', () => {
  const catalogs: Record<string, Json> = { th, ms, id, ar };

  for (const [locale, catalog] of Object.entries(catalogs)) {
    it(`${locale} has exactly the same keys as en`, () => {
      const keys = keyPaths(catalog).sort();
      const missing = en_.filter((k) => !keys.includes(k));
      const extra = keys.filter((k) => !en_.includes(k));
      expect({ locale, missing, extra }).toEqual({ locale, missing: [], extra: [] });
    });
  }

  it('en catalog is non-trivial', () => {
    expect(en_.length).toBeGreaterThan(40);
  });
});
