'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { auth, isStaff } from '@/server/auth';
import { upsertPlaceSchema } from '@/lib/validators/place';
import { createCertificationSchema } from '@/lib/validators/certification';
import { upsertPlace } from '@/server/services/places';
import { resolveSubmission } from '@/server/services/moderation';
import { writeAudit } from '@/server/services/audit';
import {
  canPublishAtLevel,
  rejectPlace,
  setDisputed,
  verifyPlace,
} from '@/server/services/verification';
import {
  createCertification,
  rejectCertification,
  verifyCertification,
} from '@/server/services/certifications';

async function requireStaff() {
  const session = await auth.api.getSession({ headers: await headers() });
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || !isStaff(role)) throw new Error('Unauthorized');
  return { id: session.user.id, role: role ?? null };
}

function opt(form: FormData, key: string): string | undefined {
  const v = form.get(key);
  return typeof v === 'string' && v.trim() !== '' ? v.trim() : undefined;
}

function i18nFromForm(form: FormData, prefix: string): Record<string, string> | undefined {
  const out: Record<string, string> = {};
  for (const l of ['th', 'en', 'ms', 'id', 'ar']) {
    const v = opt(form, `${prefix}_${l}`);
    if (v) out[l] = v;
  }
  // optional i18n fields must be undefined (not {}) so the schema's
  // "th or en required" refine doesn't reject an intentionally-empty field
  return Object.keys(out).length > 0 ? out : undefined;
}

/** Create or update a place from the admin form. */
export async function savePlaceAction(formData: FormData) {
  const actor = await requireStaff();
  const placeId = opt(formData, 'id');

  const parsed = upsertPlaceSchema.safeParse({
    type: formData.get('type'),
    slug: formData.get('slug'),
    name: i18nFromForm(formData, 'name'),
    description: i18nFromForm(formData, 'description'),
    address: i18nFromForm(formData, 'address'),
    citySlug: opt(formData, 'citySlug'),
    lat: Number(formData.get('lat')),
    lng: Number(formData.get('lng')),
    phone: opt(formData, 'phone'),
    website: opt(formData, 'website'),
    lineId: opt(formData, 'lineId'),
    googleMapsUrl: opt(formData, 'googleMapsUrl'),
    priceRange: formData.get('priceRange') ? Number(formData.get('priceRange')) : undefined,
    halalStatus: formData.get('halalStatus') ?? 'unverified',
    halalSource: formData.get('halalSource') ?? 'none',
    servesAlcohol:
      formData.get('servesAlcohol') === 'yes'
        ? true
        : formData.get('servesAlcohol') === 'no'
          ? false
          : undefined,
    categorySlugs: formData.getAll('categorySlugs').map(String),
    status: formData.get('status') ?? 'draft',
  });

  if (!parsed.success) {
    const msg = encodeURIComponent(parsed.error.issues.map((i) => i.message).join(', '));
    redirect(`/admin/places/${placeId ?? 'new'}?error=${msg}`);
  }

  const id = await upsertPlace(parsed.data, actor.id, placeId);
  await writeAudit({
    actorId: actor.id,
    actorRole: actor.role,
    action: placeId ? 'place.update' : 'place.create',
    entityType: 'place',
    entityId: id,
  });

  revalidatePath('/admin/places');
  redirect(`/admin/places/${id}?saved=1`);
}

export async function submitForReviewAction(formData: FormData) {
  const actor = await requireStaff();
  const id = String(formData.get('id'));
  await upsertPlaceStatus(id, 'pending_review');
  await writeAudit({
    actorId: actor.id,
    actorRole: actor.role,
    action: 'place.submit_review',
    entityType: 'place',
    entityId: id,
  });
  revalidatePath('/admin/verification');
  redirect('/admin/verification');
}

async function upsertPlaceStatus(id: string, status: 'pending_review' | 'draft') {
  const { db } = await import('@/server/db/client');
  const { places } = await import('@/server/db/schema');
  const { eq } = await import('drizzle-orm');
  await db.update(places).set({ status, updatedAt: new Date() }).where(eq(places.id, id));
}

/** Approve + publish a place at a trust level (enforces 4-eyes for L1/L2). */
export async function verifyPlaceAction(formData: FormData) {
  const actor = await requireStaff();
  const placeId = String(formData.get('placeId'));
  const halalStatus = formData.get('halalStatus') as
    | 'cicot_certified'
    | 'muslim_owned'
    | 'muslim_friendly'
    | 'unverified';
  const method = formData.get('verificationMethod') as
    | 'site_visit'
    | 'phone'
    | 'document'
    | 'official_registry'
    | 'owner_attestation';

  const gate = await canPublishAtLevel(placeId, actor.id, halalStatus);
  if (!gate.ok) {
    redirect(`/admin/verification?error=four_eyes`);
  }

  await verifyPlace({
    placeId,
    halalStatus,
    verificationMethod: method,
    actorId: actor.id,
    actorRole: actor.role,
    publish: true,
  });
  revalidatePath('/admin/verification');
  redirect('/admin/verification?verified=1');
}

export async function rejectPlaceAction(formData: FormData) {
  const actor = await requireStaff();
  await rejectPlace(String(formData.get('placeId')), actor.id, String(formData.get('note') ?? ''));
  revalidatePath('/admin/verification');
  redirect('/admin/verification');
}

export async function setDisputedAction(formData: FormData) {
  const actor = await requireStaff();
  await setDisputed(
    String(formData.get('placeId')),
    formData.get('disputed') === '1',
    actor.id,
  );
  revalidatePath('/admin/places');
}

export async function importAsNewAction(formData: FormData) {
  const actor = await requireStaff();
  const { importAsNew } = await import('@/server/services/imports');
  await importAsNew(String(formData.get('recordId')), actor.id);
  revalidatePath('/admin/import');
}

export async function mergeImportAction(formData: FormData) {
  const actor = await requireStaff();
  const { mergeInto } = await import('@/server/services/imports');
  await mergeInto(String(formData.get('recordId')), String(formData.get('placeId')), actor.id);
  revalidatePath('/admin/import');
}

export async function rejectImportAction(formData: FormData) {
  const actor = await requireStaff();
  const { rejectRecord } = await import('@/server/services/imports');
  await rejectRecord(String(formData.get('recordId')), actor.id);
  revalidatePath('/admin/import');
}

export async function approveClaimAction(formData: FormData) {
  const actor = await requireStaff();
  const { approveClaim } = await import('@/server/services/claims');
  await approveClaim(String(formData.get('submissionId')), actor.id);
  revalidatePath('/admin/merchant');
}

export async function applyOwnerEditAction(formData: FormData) {
  const actor = await requireStaff();
  const { applyOwnerEdit } = await import('@/server/services/claims');
  await applyOwnerEdit(String(formData.get('submissionId')), actor.id);
  revalidatePath('/admin/merchant');
}

export async function rejectOwnerSubmissionAction(formData: FormData) {
  const actor = await requireStaff();
  await resolveSubmission(String(formData.get('submissionId')), actor.id, 'rejected', 'ปฏิเสธโดยทีมงาน');
  revalidatePath('/admin/merchant');
}

export async function approveReviewAction(formData: FormData) {
  const actor = await requireStaff();
  const { approveReview } = await import('@/server/services/reviews');
  await approveReview(String(formData.get('reviewId')), actor.id);
  revalidatePath('/admin/reviews');
}

export async function hideReviewAction(formData: FormData) {
  const actor = await requireStaff();
  const { hideReview } = await import('@/server/services/reviews');
  await hideReview(String(formData.get('reviewId')), actor.id);
  revalidatePath('/admin/reviews');
}

export async function removeReviewAction(formData: FormData) {
  const actor = await requireStaff();
  const { removeReview } = await import('@/server/services/reviews');
  await removeReview(String(formData.get('reviewId')), actor.id);
  revalidatePath('/admin/reviews');
}

export async function createCertificationAction(formData: FormData) {
  const actor = await requireStaff();
  const parsed = createCertificationSchema.safeParse({
    placeId: formData.get('placeId'),
    certifyingBody: formData.get('certifyingBody') || 'CICOT',
    certNumber: opt(formData, 'certNumber'),
    issuedAt: opt(formData, 'issuedAt'),
    expiresAt: opt(formData, 'expiresAt'),
    notes: opt(formData, 'notes'),
  });
  if (!parsed.success) redirect('/admin/certificates?error=invalid');
  await createCertification(parsed.data, actor.id);
  revalidatePath('/admin/certificates');
  redirect('/admin/certificates?created=1');
}

export async function verifyCertificationAction(formData: FormData) {
  const actor = await requireStaff();
  await verifyCertification(String(formData.get('certId')), actor.id);
  revalidatePath('/admin/certificates');
}

export async function rejectCertificationAction(formData: FormData) {
  const actor = await requireStaff();
  await rejectCertification(
    String(formData.get('certId')),
    actor.id,
    String(formData.get('note') ?? ''),
  );
  revalidatePath('/admin/certificates');
}
