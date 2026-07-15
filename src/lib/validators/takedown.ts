import { z } from 'zod';

/** Public MDES notice-and-takedown intake form. */
export const createTakedownSchema = z.object({
  contentType: z.enum(['place', 'media', 'review']),
  contentId: z.uuid(),
  requesterName: z.string().trim().max(200).optional(),
  requesterContact: z.string().trim().min(3).max(200),
  reason: z.string().trim().min(10).max(4000),
  legalReference: z.string().trim().max(500).optional(),
  // requester must affirm the statement is truthful (Computer Crime Act)
  affirmTruth: z.literal(true),
  // honeypot
  website: z.string().max(0).optional(),
});

export type CreateTakedownInput = z.infer<typeof createTakedownSchema>;
