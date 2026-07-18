import { describe, expect, it } from 'vitest';
import { ApiRequestError, unwrapEnvelope } from './envelope';

describe('unwrapEnvelope', () => {
  it('returns data on success', () => {
    expect(unwrapEnvelope(200, true, { data: { items: [], total: 0 }, error: null })).toEqual({
      items: [],
      total: 0,
    });
  });

  it('throws the server error (with code) on an error envelope', () => {
    try {
      unwrapEnvelope(404, false, { data: null, error: { code: 'not_found', message: 'Place not found' } });
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(ApiRequestError);
      const err = e as ApiRequestError;
      expect(err.status).toBe(404);
      expect(err.code).toBe('not_found');
      expect(err.message).toBe('Place not found');
    }
  });

  it('prefers the error envelope even when HTTP status looks ok', () => {
    expect(() =>
      unwrapEnvelope(200, true, { data: null, error: { code: 'consent_required', message: 'x' } }),
    ).toThrow(ApiRequestError);
  });

  it('throws http_error on a non-ok response with no parseable body', () => {
    try {
      unwrapEnvelope(500, false, null);
      throw new Error('should have thrown');
    } catch (e) {
      expect((e as ApiRequestError).code).toBe('http_error');
      expect((e as ApiRequestError).status).toBe(500);
    }
  });

  it('throws when success body is missing data', () => {
    expect(() => unwrapEnvelope(200, true, { data: null, error: null })).toThrow(ApiRequestError);
  });

  it('carries validation details through', () => {
    try {
      unwrapEnvelope(400, false, {
        data: null,
        error: { code: 'validation_error', message: 'Invalid request', details: [{ path: ['q'] }] },
      });
      throw new Error('should have thrown');
    } catch (e) {
      expect((e as ApiRequestError).details).toEqual([{ path: ['q'] }]);
    }
  });
});
