import { z } from 'zod';

/**
 * Public report form. Halal concerns are confidential by design —
 * routed to the admin queue, never published (defamation-safe).
 */
export const createSubmissionSchema = z.object({
  category: z.enum([
    'new_place',
    'place_edit',
    'place_closed',
    'wrong_location',
    'halal_concern',
    'inappropriate_media',
    'other',
  ]),
  placeId: z.uuid().optional(),
  details: z.string().trim().min(10).max(4000),
  reporterContact: z.string().trim().max(200).optional(),
  // honeypot — bots fill it, humans never see it
  website: z.string().max(0).optional(),
});

export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>;

export const prayerTimesQuerySchema = z.object({
  province: z.string().min(2).max(8), // province code, e.g. 'BKK'
  from: z.iso.date().optional(),
  to: z.iso.date().optional(),
});
