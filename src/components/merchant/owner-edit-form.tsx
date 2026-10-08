import { getTranslations } from 'next-intl/server';
import { submitOwnerEditAction } from '@/app/[locale]/merchant/actions';
import type { getPlaceForEdit } from '@/server/services/admin-places';

type PlaceEdit = NonNullable<Awaited<ReturnType<typeof getPlaceForEdit>>>;

/**
 * Owner edit form — only the fields an owner may propose (no halal status,
 * no verification). Submitting creates a moderated place_edit submission.
 */
export async function OwnerEditForm({ place }: { place: PlaceEdit }) {
  const t = await getTranslations('merchant');
  const desc = (place.description ?? {}) as Record<string, string>;
  const addr = (place.address ?? {}) as Record<string, string>;

  return (
    <form action={submitOwnerEditAction} className="flex flex-col gap-3">
      <input type="hidden" name="placeId" value={place.id} />

      <label className="flex flex-col gap-1 text-sm">
        {t('fieldDescriptionTh')}
        <textarea name="description_th" defaultValue={desc.th ?? ''} rows={2} className="rounded border bg-background px-2 py-1" />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {t('fieldDescriptionEn')}
        <textarea name="description_en" defaultValue={desc.en ?? ''} rows={2} className="rounded border bg-background px-2 py-1" />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {t('fieldAddressTh')}
        <input name="address_th" defaultValue={addr.th ?? ''} className="rounded border bg-background px-2 py-1" />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          {t('fieldPhone')}
          <input name="phone" defaultValue={place.phone ?? ''} className="rounded border bg-background px-2 py-1" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          LINE ID
          <input name="lineId" defaultValue={place.lineId ?? ''} className="rounded border bg-background px-2 py-1" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t('fieldWebsite')}
          <input name="website" defaultValue={place.website ?? ''} className="rounded border bg-background px-2 py-1" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Google Maps URL
          <input name="googleMapsUrl" defaultValue={place.googleMapsUrl ?? ''} className="rounded border bg-background px-2 py-1" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t('fieldPriceRange')}
          <input name="priceRange" type="number" min="1" max="4" defaultValue={place.priceRange ?? ''} className="rounded border bg-background px-2 py-1" />
        </label>
      </div>

      <button className="self-start rounded-lg border px-4 py-2 text-sm font-medium hover:bg-foreground/5">
        {t('saveChanges')}
      </button>
    </form>
  );
}
