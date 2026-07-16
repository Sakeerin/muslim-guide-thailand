import { z } from 'zod';

export const createReviewSchema = z.object({
  placeId: z.uuid(),
  rating: z.number().int().min(1).max(5),
  body: z.string().trim().max(2000).optional(),
  lang: z.string().min(2).max(5).optional(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
