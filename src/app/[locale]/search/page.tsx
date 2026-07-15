import type { Metadata } from 'next';
import { getLocale, getTranslations, setRequestLocale } from 'next-intl/server';
import { listCities, listPlaces } from '@/server/services/places';
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
  // search results are user-specific — keep out of the index
  return { title: t('search'), robots: { index: false } };
}

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
  const flat = Object.fromEntries(
    Object.entries(sp).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]),
  );
  const parsed = listPlacesQuerySchema.safeParse(flat);
  const query = parsed.success ? parsed.data : listPlacesQuerySchema.parse({});

  const [t, currentLocale, cities] = await Promise.all([
    getTranslations(),
    getLocale(),
    listCities(),
  ]);

  const hasQuery = Boolean(query.q || query.city || query.type);
  const { items } = hasQuery ? await listPlaces(query) : { items: [] };

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-10">
      <h1 className="text-3xl font-bold">{t('common.search')}</h1>

      <form method="GET" className="flex flex-col gap-3 sm:flex-row">
        <input
          type="search"
          name="q"
          defaultValue={query.q ?? ''}
          placeholder={t('common.searchPlaceholder')}
          className="flex-1 rounded-lg border bg-background px-4 py-2"
        />
        <select
          name="city"
          defaultValue={query.city ?? ''}
          className="rounded-lg border bg-background px-3 py-2"
        >
          <option value="">{t('nav.cities')}</option>
          {cities.map((c) => (
            <option key={c.slug} value={c.slug}>
              {resolveI18n(c.name as never, currentLocale)}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-lg border px-6 py-2 font-medium hover:bg-foreground/5">
          {t('common.search')}
        </button>
      </form>

      {hasQuery && items.length === 0 && (
        <p className="rounded-xl border p-6 text-center opacity-70">
          {/* zero-result — logged as a data-coverage signal (analytics wiring in month 4) */}
          {locale === 'th' ? 'ไม่พบผลลัพธ์ — ลองคำค้นอื่นหรือเลือกเมือง' : 'No results — try another keyword or pick a city'}
        </p>
      )}

      {items.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((place) => (
            <PlaceCard key={place.id} place={place} />
          ))}
        </div>
      )}
    </main>
  );
}
