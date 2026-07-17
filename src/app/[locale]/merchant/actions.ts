'use server';

import { headers } from 'next/headers';
import { redirect } from '@/i18n/navigation';
import { getLocale } from 'next-intl/server';
import { auth } from '@/server/auth';
import { ownerEditSchema } from '@/lib/validators/claim';
import { submitOwnerEdit } from '@/server/services/claims';

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
  return Object.keys(out).length > 0 ? out : undefined;
}

/** Owner proposes changes to a place they own → moderated place_edit. */
export async function submitOwnerEditAction(formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Unauthorized');
  const locale = await getLocale();

  const parsed = ownerEditSchema.safeParse({
    placeId: formData.get('placeId'),
    description: i18nFromForm(formData, 'description'),
    address: i18nFromForm(formData, 'address'),
    phone: opt(formData, 'phone'),
    website: opt(formData, 'website'),
    lineId: opt(formData, 'lineId'),
    googleMapsUrl: opt(formData, 'googleMapsUrl'),
    priceRange: formData.get('priceRange') ? Number(formData.get('priceRange')) : undefined,
  });
  if (!parsed.success) {
    redirect({ href: `/merchant?error=1`, locale });
  }

  // throws if the caller is not the owner (defence-in-depth)
  await submitOwnerEdit(parsed.data!, session.user.id);
  redirect({ href: `/merchant?submitted=1`, locale });
}
