import type { ApiEnvelope } from '@/types/api';

/** A failed /api/v1 call — carries the server's error code + HTTP status. */
export class ApiRequestError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * Unwrap the { data, error } envelope into the payload, or throw. Pure — no
 * network — so it can be unit-tested exhaustively (200 / 4xx / malformed body).
 */
export function unwrapEnvelope<T>(status: number, ok: boolean, json: ApiEnvelope<T> | null): T {
  if (json?.error) {
    throw new ApiRequestError(status, json.error.code, json.error.message, json.error.details);
  }
  if (!ok || !json || json.data == null) {
    throw new ApiRequestError(status, 'http_error', `Request failed (HTTP ${status})`);
  }
  return json.data;
}
