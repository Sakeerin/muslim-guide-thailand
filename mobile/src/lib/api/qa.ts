import type { PlaceQuestionsResponse, QAResult } from '@/types/api';
import { apiFetch } from './client';

/** Published Q&A for a place (public). */
export function getPlaceQuestions(
  slug: string,
  signal?: AbortSignal,
): Promise<PlaceQuestionsResponse> {
  return apiFetch<PlaceQuestionsResponse>(`/api/v1/places/${encodeURIComponent(slug)}/questions`, {
    signal,
  });
}

/** Ask a question (bearer auth; 403 consent_required if no publication consent). */
export function postQuestion(input: {
  placeId: string;
  body: string;
  lang?: string;
}): Promise<QAResult> {
  return apiFetch<QAResult>('/api/v1/questions', {
    method: 'POST',
    auth: true,
    body: { placeId: input.placeId, body: input.body.trim(), lang: input.lang },
  });
}

/** Answer a published question (bearer auth; 403 consent_required as above). */
export function postAnswer(input: {
  questionId: string;
  body: string;
  lang?: string;
}): Promise<QAResult> {
  return apiFetch<QAResult>('/api/v1/answers', {
    method: 'POST',
    auth: true,
    body: { questionId: input.questionId, body: input.body.trim(), lang: input.lang },
  });
}
