import { z } from 'zod';

/** Ask a question about a place. Body required (it IS the question). */
export const createQuestionSchema = z.object({
  placeId: z.uuid(),
  body: z.string().trim().min(5).max(1000),
  lang: z.string().min(2).max(5).optional(),
});
export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;

/** Answer a question. */
export const createAnswerSchema = z.object({
  questionId: z.uuid(),
  body: z.string().trim().min(2).max(2000),
  lang: z.string().min(2).max(5).optional(),
});
export type CreateAnswerInput = z.infer<typeof createAnswerSchema>;
