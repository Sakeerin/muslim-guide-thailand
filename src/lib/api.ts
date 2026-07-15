import { NextResponse } from 'next/server';
import type { ZodError } from 'zod';

/** Standard envelope for /api/v1 — the same contract a native app will use. */
export function apiOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data, error: null }, init);
}

export function apiError(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json(
    { data: null, error: { code, message, details } },
    { status },
  );
}

export function apiValidationError(error: ZodError) {
  return apiError(400, 'validation_error', 'Invalid request', error.issues);
}
