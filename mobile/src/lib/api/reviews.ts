import type { CreateReviewResult, PlaceReviewsResponse } from '@/types/api';
import { apiFetch } from './client';

/**
 * The PDPA consents recorded before a user's first review can be published —
 * mirrors the web register flow (src/app/[locale]/(auth)/register). Publishing a
 * review reveals the author publicly, so it needs review_publication consent.
 */
export const REVIEW_CONSENTS = ['privacy_policy', 'review_publication'] as const;

/** Trim a review body, treating whitespace-only as "no body". Pure. */
export function normalizeReviewBody(body: string | undefined | null): string | undefined {
  const trimmed = body?.trim();
  return trimmed ? trimmed : undefined;
}

/** Published reviews for a place (public — no auth). */
export function getPlaceReviews(slug: string, signal?: AbortSignal): Promise<PlaceReviewsResponse> {
  return apiFetch<PlaceReviewsResponse>(`/api/v1/places/${encodeURIComponent(slug)}/reviews`, {
    signal,
  });
}

export interface PostReviewInput {
  placeId: string;
  rating: number;
  body?: string;
  lang?: string;
}

/** Post/update a review. Requires a signed-in bearer token; the server 403s
 *  ('consent_required') if review_publication consent hasn't been recorded. */
export function postReview(input: PostReviewInput): Promise<CreateReviewResult> {
  return apiFetch<CreateReviewResult>('/api/v1/reviews', {
    method: 'POST',
    auth: true,
    body: {
      placeId: input.placeId,
      rating: input.rating,
      body: normalizeReviewBody(input.body),
      lang: input.lang,
    },
  });
}

/** Record the review-publication consent for the signed-in user. */
export function recordReviewConsent(): Promise<{ recorded: number }> {
  return apiFetch<{ recorded: number }>('/api/v1/account/consent', {
    method: 'POST',
    auth: true,
    body: { consents: [...REVIEW_CONSENTS] },
  });
}
