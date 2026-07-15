import { z } from 'zod';

export const placeTypeSchema = z.enum([
  'restaurant',
  'mosque',
  'prayer_room',
  'hotel',
  'attraction',
  'shop',
  'other',
]);

export const halalStatusSchema = z.enum([
  'cicot_certified',
  'muslim_owned',
  'muslim_friendly',
  'unverified',
]);

export const listPlacesQuerySchema = z.object({
  city: z.string().min(1).max(64).optional(),
  type: placeTypeSchema.optional(),
  category: z.string().min(1).max(64).optional(),
  halal: z
    .string()
    .transform((v) => v.split(','))
    .pipe(z.array(halalStatusSchema))
    .optional(),
  q: z.string().trim().min(1).max(120).optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radius: z.coerce.number().int().min(100).max(50_000).default(3_000),
  openNow: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).max(10_000).default(0),
});

export type ListPlacesQuery = z.infer<typeof listPlacesQuerySchema>;

export const i18nTextSchema = z
  .object({
    th: z.string().max(500).optional(),
    en: z.string().max(500).optional(),
    ms: z.string().max(500).optional(),
    id: z.string().max(500).optional(),
    ar: z.string().max(500).optional(),
  })
  .refine((v) => Boolean(v.th || v.en), { message: 'th or en is required' });

const timeRange = z.tuple([
  z.string().regex(/^\d{1,2}:\d{2}$/),
  z.string().regex(/^\d{1,2}:\d{2}$/),
]);

export const openingHoursSchema = z
  .object({
    mon: z.array(timeRange).optional(),
    tue: z.array(timeRange).optional(),
    wed: z.array(timeRange).optional(),
    thu: z.array(timeRange).optional(),
    fri: z.array(timeRange).optional(),
    sat: z.array(timeRange).optional(),
    sun: z.array(timeRange).optional(),
  })
  .optional();

/** Admin create/update — staff only in MVP. */
export const upsertPlaceSchema = z.object({
  type: placeTypeSchema,
  slug: z
    .string()
    .min(3)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'lowercase latin slug'),
  name: i18nTextSchema,
  description: i18nTextSchema.optional(),
  address: i18nTextSchema.optional(),
  citySlug: z.string().min(1).max(64).optional(),
  districtSlug: z.string().min(1).max(64).optional(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  phone: z.string().max(32).optional(),
  website: z.string().url().max(300).optional(),
  lineId: z.string().max(64).optional(),
  googleMapsUrl: z.string().url().max(500).optional(),
  openingHours: openingHoursSchema,
  priceRange: z.number().int().min(1).max(4).optional(),
  halalStatus: halalStatusSchema.default('unverified'),
  halalSource: z
    .enum([
      'cicot_certificate',
      'owner_declaration',
      'field_verification',
      'community_verified',
      'imported',
      'none',
    ])
    .default('none'),
  servesAlcohol: z.boolean().nullable().optional(),
  attributes: z.record(z.string(), z.unknown()).default({}),
  categorySlugs: z.array(z.string()).default([]),
  status: z
    .enum(['draft', 'pending_review', 'published', 'published_unverified', 'archived'])
    .default('draft'),
});

export type UpsertPlaceInput = z.infer<typeof upsertPlaceSchema>;
