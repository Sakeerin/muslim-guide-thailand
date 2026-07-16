import type { Metadata } from 'next';
import { getLocale, getTranslations, setRequestLocale } from 'next-intl/server';
import { listCities } from '@/server/services/places';
import { searchPlaces } from '@/server/services/search';
import { listPlacesQuerySchema } from '@/lib/validators/place';
import { resolveI18n } from '@/lib/i18n-content';
import { PlaceCard } from '@/components/place-card';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'common' });
  return { title: t('search'), robots: { index: false } };
}

const TYPE_OPTIONS = [
  { value: '', key: 'all' },
  { value: 'restaurant', key: 'restaurant' },
  { value: 'mosque', key: 'mosque' },
  { value: 'prayer_room', key: 'prayerRoom' },
  { value: 'attraction', key: 'attraction' },
];
const TYPE_LABEL: Record<string, Record<string, string>> = {
  all: { th: 'ทุกประเภท', en: 'All types' },
  restaurant: { th: 'ร้านอาหาร', en: 'Restaurants' },
  mosque: { th: 'มัสยิด', en: 'Mosques' },
  prayerRoom: { th: 'ห้องละหมาด', en: 'Prayer rooms' },
  attraction: { th: 'ที่เที่ยว', en: 'Attractions' },
};

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const sp = await searchParams;
  // The GET filter form submits empty selects as "" — drop them so optional
  // enum/string params don't fail validation and blank out the whole query.
  const flat = Object.fromEntries(
    Object.entries(sp)
      .map(([k, v]) => [k, Array.isArray(v) ? v[0] : v] as const)
      .filter(([, v]) => v !== undefined && v !== ''),
  );
  const parsed = listPlacesQuerySchema.safeParse(flat);
  const query = parsed.success ? parsed.data : listPlacesQuerySchema.parse({});

  const [t, currentLocale, cities] = await Promise.all([
    getTranslations(),
    getLocale(),
    listCities(),
  ]);

  const hasQuery = Boolean(query.q || query.city || query.type || query.openNow);
  const result = hasQuery ? await searchPlaces(query, currentLocale) : null;
  const lbl = (key: string) => TYPE_LABEL[key][locale] ?? TYPE_LABEL[key].en;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-10">
      <h1 className="text-3xl font-bold">{t('common.search')}</h1>

      <form method="GET" className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="search"
            name="q"
            defaultValue={query.q ?? ''}
            placeholder={t('common.searchPlaceholder')}
            className="flex-1 rounded-lg border bg-background px-4 py-2"
          />
          <button type="submit" className="rounded-lg border px-6 py-2 font-medium hover:bg-foreground/5">
            {t('common.search')}
          </button>
        </div>
        <div className="flex flex-wrap gap-3">
          <select name="city" defaultValue={query.city ?? ''} className="rounded-lg border bg-background px-3 py-2 text-sm">
            <option value="">{t('nav.cities')}</option>
            {cities.map((c) => (
              <option key={c.slug} value={c.slug}>
                {resolveI18n(c.name as never, currentLocale)}
              </option>
            ))}
          </select>
          <select name="type" defaultValue={query.type ?? ''} className="rounded-lg border bg-background px-3 py-2 text-sm">
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{lbl(o.key)}</option>
            ))}
          </select>
          <select name="halal" defaultValue={query.halal?.[0] ?? ''} className="rounded-lg border bg-background px-3 py-2 text-sm">
            <option value="">{t('trust.howWeVerify')}</option>
            <option value="cicot_certified">{t('trust.cicot_certified')}</option>
            <option value="muslim_owned">{t('trust.muslim_owned')}</option>
            <option value="muslim_friendly">{t('trust.muslim_friendly')}</option>
          </select>
          <label className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
            <input type="checkbox" name="openNow" value="true" defaultChecked={query.openNow} />
            {t('place.openNow')}
          </label>
        </div>
      </form>

      {result?.inferred && (result.inferred.type || result.inferred.citySlug || result.inferred.categorySlug) && (
        <p className="text-xs opacity-60">
          {locale === 'th' ? 'ตีความคำค้นเป็น: ' : 'Interpreted as: '}
          {[result.inferred.type, result.inferred.citySlug, result.inferred.categorySlug].filter(Boolean).join(' · ')}
        </p>
      )}

      {result && result.items.length === 0 && (
        <p className="rounded-xl border p-6 text-center opacity-70">
          {locale === 'th' ? 'ไม่พบผลลัพธ์ — ลองคำค้นอื่นหรือเลือกเมือง' : 'No results — try another keyword or pick a city'}
        </p>
      )}

      {result && result.items.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {result.items.map((place) => (
            <PlaceCard key={place.id} place={place} />
          ))}
        </div>
      )}
    </main>
  );
}
