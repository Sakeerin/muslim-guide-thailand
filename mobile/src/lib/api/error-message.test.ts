import { describe, expect, it } from 'vitest';
import { ApiRequestError } from './envelope';
import { errorMessageKey } from './error-message';

const apiErr = (code: string) => new ApiRequestError(400, code, 'msg');

describe('errorMessageKey', () => {
  it('maps known API codes to errors.* keys', () => {
    expect(errorMessageKey(apiErr('rate_limited'))).toBe('errors.rateLimited');
    expect(errorMessageKey(apiErr('feature_disabled'))).toBe('errors.featureDisabled');
    expect(errorMessageKey(apiErr('validation_error'))).toBe('errors.validation');
  });

  it('falls back to generic for other API codes', () => {
    expect(errorMessageKey(apiErr('http_error'))).toBe('errors.generic');
    expect(errorMessageKey(apiErr('not_found'))).toBe('errors.generic');
  });

  it('treats a non-API throw (fetch reject) as a network error', () => {
    expect(errorMessageKey(new Error('Network request failed'))).toBe('errors.network');
    expect(errorMessageKey(undefined)).toBe('errors.network');
  });
});
