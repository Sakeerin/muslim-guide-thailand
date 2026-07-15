import { z } from 'zod';

export const createCertificationSchema = z.object({
  placeId: z.uuid(),
  certifyingBody: z.string().trim().min(2).max(120).default('CICOT'),
  certNumber: z.string().trim().min(1).max(120).optional(),
  issuedAt: z.iso.date().optional(),
  expiresAt: z.iso.date().optional(),
  evidenceFileKey: z.string().trim().max(500).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export type CreateCertificationInput = z.infer<typeof createCertificationSchema>;
