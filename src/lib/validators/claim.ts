import { z } from 'zod';
import { i18nTextSchema, openingHoursSchema } from './place';

export const createClaimSchema = z.object({
  placeId: z.uuid(),
  contact: z.string().trim().min(3).max(200),
  message: z.string().trim().max(2000).optional(),
  // honeypot
  website: z.string().max(0).optional(),
});
export type CreateClaimInput = z.infer<typeof createClaimSchema>;

/**
 * Fields an owner may PROPOSE to change. Deliberately excludes halalStatus /
 * halalSource / verification — trust level stays a staff decision through the
 * verification workflow, never editable by the owner. Owner edits are always
 * moderated (a submission), never a direct write.
 */
export const ownerEditSchema = z.object({
  placeId: z.uuid(),
  description: i18nTextSchema.optional(),
  address: i18nTextSchema.optional(),
  phone: z.string().max(32).optional(),
  website: z.string().url().max(300).optional(),
  lineId: z.string().max(64).optional(),
  googleMapsUrl: z.string().url().max(500).optional(),
  openingHours: openingHoursSchema,
  priceRange: z.number().int().min(1).max(4).optional(),
});
export type OwnerEditInput = z.infer<typeof ownerEditSchema>;

/** Field keys an owner edit is allowed to carry (used to sanitize the diff). */
export const OWNER_EDITABLE_FIELDS = [
  'description',
  'address',
  'phone',
  'website',
  'lineId',
  'googleMapsUrl',
  'openingHours',
  'priceRange',
] as const;
