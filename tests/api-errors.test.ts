import { describe, expect, it } from 'vitest';
import en from '../messages/en.json';
import { errorMessageKey } from '@/lib/api-errors';

describe('errorMessageKey', () => {
  it('maps known API codes to their errors.* key', () => {
    expect(errorMessageKey('rate_limited')).toBe('errors.rateLimited');
    expect(errorMessageKey('feature_disabled')).toBe('errors.featureDisabled');
    expect(errorMessageKey('validation_error')).toBe('errors.validation');
  });

  it('falls back to generic for unknown / missing codes', () => {
    expect(errorMessageKey('some_new_code')).toBe('errors.generic');
    expect(errorMessageKey(undefined)).toBe('errors.generic');
    expect(errorMessageKey(null)).toBe('errors.generic');
  });

  it('every key it can return exists in the errors catalog', () => {
    const codes = ['rate_limited', 'feature_disabled', 'validation_error', 'unknown', undefined];
    for (const code of codes) {
      const leaf = errorMessageKey(code).split('.')[1];
      expect(en.errors).toHaveProperty(leaf);
    }
    // the network path is used directly by callers, not via the mapper
    expect(en.errors).toHaveProperty('network');
  });
});
