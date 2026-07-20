import { getTranslations } from 'next-intl/server';
import { savePlaceAction } from '@/app/admin/(protected)/actions';
import { getAdminLocale } from '@/server/admin-locale';
import type { getFormOptions, getPlaceForEdit } from '@/server/services/admin-places';

type FormOptions = Awaited<ReturnType<typeof getFormOptions>>;
type PlaceEdit = Awaited<ReturnType<typeof getPlaceForEdit>>;

// Each locale's endonym — not translated (a language is always named in itself).
const LOCALE_LABEL: Record<string, string> = {
  th: 'ไทย',
  en: 'English',
  ms: 'Melayu',
  id: 'Indonesia',
  ar: 'العربية',
};

// DB enum values — shown raw (they map 1:1 to stored values), not translated.
const PLACE_TYPES = ['restaurant', 'mosque', 'prayer_room', 'hotel', 'attraction', 'shop', 'other'];
const HALAL_STATUSES = ['unverified', 'muslim_friendly', 'muslim_owned', 'cicot_certified'];
const HALAL_SOURCES = [
  'none',
  'owner_declaration',
  'field_verification',
  'community_verified',
  'cicot_certificate',
  'imported',
];
const STATUSES = ['draft', 'pending_review', 'published', 'published_unverified', 'archived'];

function i18nField(prefix: string, label: string, value?: Record<string, string>) {
  return (
    <fieldset className="rounded-lg border p-3">
      <legend className="px-1 text-sm font-medium">{label}</legend>
      <label className="flex flex-col gap-1 text-sm">
        {LOCALE_LABEL.th}
        <input name={`${prefix}_th`} defaultValue={value?.th ?? ''} className="rounded border bg-background px-2 py-1" />
      </label>
      <label className="mt-2 flex flex-col gap-1 text-sm">
        {LOCALE_LABEL.en}
        <input name={`${prefix}_en`} defaultValue={value?.en ?? ''} className="rounded border bg-background px-2 py-1" />
      </label>
      <details className="mt-2">
        <summary className="cursor-pointer text-xs opacity-70">ms / id / ar</summary>
        <div className="mt-2 flex flex-col gap-2">
          {(['ms', 'id', 'ar'] as const).map((l) => (
            <label key={l} className="flex flex-col gap-1 text-sm">
              {LOCALE_LABEL[l]}
              <input
                name={`${prefix}_${l}`}
                defaultValue={value?.[l] ?? ''}
                dir={l === 'ar' ? 'rtl' : 'ltr'}
                className="rounded border bg-background px-2 py-1"
              />
            </label>
          ))}
        </div>
      </details>
    </fieldset>
  );
}

export async function PlaceForm({
  place,
  options,
}: {
  place: PlaceEdit;
  options: FormOptions;
}) {
  const locale = await getAdminLocale();
  const t = await getTranslations({ locale, namespace: 'admin.places' });
  const selectedCats = new Set(place?.categorySlugs ?? []);

  return (
    <form action={savePlaceAction} className="flex flex-col gap-4">
      {place && <input type="hidden" name="id" value={place.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          {t('type')}
          <select name="type" defaultValue={place?.type ?? 'restaurant'} className="rounded border bg-background px-2 py-1">
            {PLACE_TYPES.map((ty) => (
              <option key={ty} value={ty}>{ty}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Slug (latin, unique)
          <input name="slug" required defaultValue={place?.slug ?? ''} className="rounded border bg-background px-2 py-1" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {i18nField('name', t('name'), place?.name as Record<string, string> | undefined)}
        {i18nField('description', t('description'), place?.description as Record<string, string> | undefined)}
        {i18nField('address', t('address'), place?.address as Record<string, string> | undefined)}
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <label className="flex flex-col gap-1 text-sm">
          {t('city')}
          <select name="citySlug" defaultValue={place?.citySlug ?? ''} className="rounded border bg-background px-2 py-1">
            <option value="">—</option>
            {options.cities.map((c) => (
              <option key={c.slug} value={c.slug}>
                {(c.name as Record<string, string>).th}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Latitude
          <input name="lat" required type="number" step="any" defaultValue={place?.lat ?? ''} className="rounded border bg-background px-2 py-1" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Longitude
          <input name="lng" required type="number" step="any" defaultValue={place?.lng ?? ''} className="rounded border bg-background px-2 py-1" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t('priceRange')}
          <input name="priceRange" type="number" min="1" max="4" defaultValue={place?.priceRange ?? ''} className="rounded border bg-background px-2 py-1" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-1 text-sm">
          {t('phone')}
          <input name="phone" defaultValue={place?.phone ?? ''} className="rounded border bg-background px-2 py-1" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t('website')}
          <input name="website" defaultValue={place?.website ?? ''} className="rounded border bg-background px-2 py-1" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          LINE ID
          <input name="lineId" defaultValue={place?.lineId ?? ''} className="rounded border bg-background px-2 py-1" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Google Maps URL
          <input name="googleMapsUrl" defaultValue={place?.googleMapsUrl ?? ''} className="rounded border bg-background px-2 py-1" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm">
          {t('halalStatus')}
          <select name="halalStatus" defaultValue={place?.halalStatus ?? 'unverified'} className="rounded border bg-background px-2 py-1">
            {HALAL_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t('halalSource')}
          <select name="halalSource" defaultValue={place?.halalSource ?? 'none'} className="rounded border bg-background px-2 py-1">
            {HALAL_SOURCES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t('servesAlcohol')}
          <select
            name="servesAlcohol"
            defaultValue={place?.servesAlcohol === true ? 'yes' : place?.servesAlcohol === false ? 'no' : ''}
            className="rounded border bg-background px-2 py-1"
          >
            <option value="">{t('alcoholUnknown')}</option>
            <option value="no">{t('alcoholNo')}</option>
            <option value="yes">{t('alcoholYes')}</option>
          </select>
        </label>
      </div>

      <fieldset className="rounded-lg border p-3">
        <legend className="px-1 text-sm font-medium">{t('categories')}</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {options.categories.map((c) => (
            <label key={c.slug} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="categorySlugs"
                value={c.slug}
                defaultChecked={selectedCats.has(c.slug)}
              />
              {(c.name as Record<string, string>).th}
              <span className="text-xs opacity-40">{c.placeType.slice(0, 4)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-4">
        <label className="flex flex-col gap-1 text-sm">
          {t('publishStatus')}
          <select name="status" defaultValue={place?.status ?? 'draft'} className="rounded border bg-background px-2 py-1">
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
        <button className="mt-5 rounded-lg border px-6 py-2 font-medium hover:bg-foreground/5">
          {t('save')}
        </button>
      </div>

      <p className="text-xs opacity-60">{t('fourEyesNote')}</p>
    </form>
  );
}
