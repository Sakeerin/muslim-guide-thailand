import { describe, expect, it } from 'vitest';
import en from '../messages/en.json';
import { errorMessageKey } from '@/lib/api-errors';

describe('errorMessageKey', () => {
  it('maps known API codes to their errors.* leaf', () => {
    expect(errorMessageKey('rate_limited')).toBe('rateLimited');
    expect(errorMessageKey('feature_disabled')).toBe('featureDisabled');
    expect(errorMessageKey('validation_error')).toBe('validation');
  });

  it('falls back to generic for unknown / missing codes', () => {
    expect(errorMessageKey('some_new_code')).toBe('generic');
    expect(errorMessageKey(undefined)).toBe('generic');
    expect(errorMessageKey(null)).toBe('generic');
  });

  it('every key it can return exists in the errors catalog', () => {
    const codes = ['rate_limited', 'feature_disabled', 'validation_error', 'unknown', undefined];
    for (const code of codes) {
      expect(en.errors).toHaveProperty(errorMessageKey(code));
    }
    // the network path is used directly by callers, not via the mapper
    expect(en.errors).toHaveProperty('network');
  });
});
