import { pgEnum } from 'drizzle-orm/pg-core';

export const placeTypeEnum = pgEnum('place_type', [
  'restaurant',
  'mosque',
  'prayer_room',
  'hotel',
  'attraction',
  'shop',
  'other',
]);

// 4 trust levels — always displayed together with the verification source.
// The platform never certifies halal itself (Criminal Code s.272-273).
export const halalStatusEnum = pgEnum('halal_status', [
  'cicot_certified', // L1
  'muslim_owned', // L2
  'muslim_friendly', // L3
  'unverified', // L4 — default for every imported record
]);

export const halalSourceEnum = pgEnum('halal_source', [
  'cicot_certificate',
  'owner_declaration',
  'field_verification',
  'community_verified',
  'imported',
  'none',
]);

export const verificationMethodEnum = pgEnum('verification_method', [
  'site_visit',
  'phone',
  'document',
  'official_registry',
  'owner_attestation',
]);

// published_unverified: government-registry mosques may go public with an
// "unverified" badge; never used for restaurants (L1/L2 need 4-eyes review).
export const contentStatusEnum = pgEnum('content_status', [
  'draft',
  'pending_review',
  'published',
  'published_unverified',
  'archived',
  'removed',
]);

export const certStatusEnum = pgEnum('cert_status', [
  'pending',
  'verified',
  'rejected',
  'expired',
]);

export const reviewStatusEnum = pgEnum('review_status', [
  'pending',
  'published',
  'hidden',
  'removed',
]);

export const submissionStatusEnum = pgEnum('submission_status', [
  'pending',
  'in_review',
  'approved',
  'rejected',
]);

export const submissionCategoryEnum = pgEnum('submission_category', [
  'new_place',
  'place_edit',
  'place_closed',
  'wrong_location',
  'halal_concern', // confidential queue — never shown publicly
  'inappropriate_media',
  'claim',
  'other',
]);

export const takedownStatusEnum = pgEnum('takedown_status', [
  'received',
  'in_review',
  'content_hidden',
  'content_removed',
  'rejected',
  'escalated',
]);
