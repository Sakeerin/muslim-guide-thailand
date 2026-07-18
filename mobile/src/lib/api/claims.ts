import { apiFetch } from './client';

export interface ClaimInput {
  contact: string;
  message?: string;
}

export interface ClaimResult {
  received: boolean;
  id?: string;
}

/** Trim a claim message, treating whitespace-only as omitted. Pure. */
export function normalizeClaimMessage(message: string | undefined | null): string | undefined {
  const trimmed = message?.trim();
  return trimmed ? trimmed : undefined;
}

/**
 * Submit an ownership claim for a place. Requires a signed-in bearer token; the
 * server injects placeId from the slug, 409s if already claimed, and routes the
 * claim to the admin queue (staff grant ownership after checking). We never
 * send the server's `website` honeypot field — the app is a legitimate client.
 */
export function claimPlace(slug: string, input: ClaimInput): Promise<ClaimResult> {
  return apiFetch<ClaimResult>(`/api/v1/places/${encodeURIComponent(slug)}/claim`, {
    method: 'POST',
    auth: true,
    body: {
      contact: input.contact.trim(),
      message: normalizeClaimMessage(input.message),
    },
  });
}
