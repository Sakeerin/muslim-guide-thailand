import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { getPlaceBySlug, nearbyPlaces, prayerPlacesNearby } from '@/server/services/places';
import { resolveI18n } from '@/lib/i18n-content';
import { alternatesFor, SITE_URL } from '@/lib/seo';
import { openStatusAt } from '@/lib/opening-hours';
import { TrustBox } from '@/components/halal-badge';
import { PlaceCard } from '@/components/place-card';
import { PlaceActions } from '@/components/place-actions';
import { ReviewForm } from '@/components/review-form';
import { ClaimButton } from '@/components/claim-button';
import { listPublishedReviews } from '@/server/services/reviews';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const place = await getPlaceBySlug(slug);
  if (!place) return {};
  const name = resolveI18n(place.name as never, locale);
  const description = resolveI18n(place.description as never, locale);
  return {
    title: name,
    description: description || undefined,
    alternates: alternatesFor(`/place/${slug}`),
  };
}

function jsonLd(place: NonNullable<Awaited<ReturnType<typeof getPlaceBySlug>>>, locale: string) {
  const name = resolveI18n(place.name as never, locale);
  const isRestaurant = place.type === 'restaurant';
  return {
    '@context': 'https://schema.org',
    '@type': isRestaurant ? 'Restaurant' : place.type === 'mosque' ? 'Mosque' : 'LocalBusiness',
    name,
    url: `${SITE_URL}/${locale}/place/${place.slug}`,
    geo: { '@type': 'GeoCoordinates', latitude: place.lat, longitude: place.lng },
    address: resolveI18n(place.address as never, locale) || undefined,
    telephone: place.phone ?? undefined,
    servesCuisine: isRestaurant
      ? place.categories.map((c) => resolveI18n(c.name as never, 'en')).join(', ') || undefined
      : undefined,
  };
}

export default async function PlacePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const place = await getPlaceBySlug(slug);
  if (!place) notFound();

  const [t, format, prayerNearby, nearby, publishedReviews] = await Promise.all([
    getTranslations(),
    getFormatter(),
    place.type === 'mosque' || place.type === 'prayer_room'
      ? Promise.resolve([])
      : prayerPlacesNearby(place.lat, place.lng),
    nearbyPlaces(place.lat, place.lng, place.id),
    listPublishedReviews(place.id),
  ]);

  const name = resolveI18n(place.name as never, locale);
  const thaiName = (place.name as Record<string, string>).th;
  const description = resolveI18n(place.description as never, locale);
  const address = resolveI18n(place.address as never, locale);
  const openStatus = openStatusAt(place.openingHours as never, new Date());

  const DAY_LABELS: Record<string, string> = {
    mon: format.dateTime(new Date(2026, 0, 5), { weekday: 'short' }),
    tue: format.dateTime(new Date(2026, 0, 6), { weekday: 'short' }),
    wed: format.dateTime(new Date(2026, 0, 7), { weekday: 'short' }),
    thu: format.dateTime(new Date(2026, 0, 8), { weekday: 'short' }),
    fri: format.dateTime(new Date(2026, 0, 9), { weekday: 'short' }),
    sat: format.dateTime(new Date(2026, 0, 10), { weekday: 'short' }),
    sun: format.dateTime(new Date(2026, 0, 11), { weekday: 'short' }),
  };

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(place, locale)) }}
      />

      <header>
        <h1 className="text-2xl font-bold sm:text-3xl">{name}</h1>
        {thaiName && thaiName !== name && (
          <p className="mt-1 opacity-70">
            {thaiName}
            <span className="ms-2 text-xs opacity-60">({t('place.thaiNameHint')})</span>
          </p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
          {openStatus.known && (
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs ${openStatus.open ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'}`}
            >
              {openStatus.open
                ? openStatus.closesAt
                  ? `${t('place.openNow')} · ${t('place.closesAt', { time: openStatus.closesAt })}`
                  : t('place.openNow')
                : openStatus.opensAt
                  ? `${t('place.closedNow')} · ${t('place.opensAt', { time: openStatus.opensAt })}`
                  : t('place.closedNow')}
            </span>
          )}
          {place.priceRange && <span className="opacity-60">{'฿'.repeat(place.priceRange)}</span>}
        </div>
      </header>

      <TrustBox
        status={place.halalStatus}
        disputed={place.disputed}
        lastVerifiedAt={place.lastVerifiedAt}
        certifications={place.certifications as never}
      />

      <PlaceActions
        slug={place.slug}
        name={name}
        lat={place.lat}
        lng={place.lng}
        phone={place.phone}
        googleMapsUrl={place.googleMapsUrl}
      />

      {description && <p className="opacity-80">{description}</p>}

      <section className="flex flex-col gap-2 text-sm">
        {address && (
          <p>
            <span className="font-medium">{t('place.address')}: </span>
            {address}
          </p>
        )}
        {place.servesAlcohol === false && (
          <p className="text-emerald-700">{t('place.noAlcohol')}</p>
        )}
        {place.servesAlcohol === true && (
          <p className="text-amber-700">{t('place.servesAlcohol')}</p>
        )}
      </section>

      {place.openingHours && (
        <section>
          <h2 className="mb-2 font-semibold">{t('place.openingHours')}</h2>
          <table className="w-full max-w-sm text-sm">
            <tbody>
              {(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const).map((day) => {
                const ranges = (place.openingHours as Record<string, [string, string][]>)[day];
                return (
                  <tr key={day} className="border-b last:border-0">
                    <td className="py-1 pe-4 font-medium">{DAY_LABELS[day]}</td>
                    <td className="py-1 opacity-80">
                      {ranges?.length
                        ? ranges.map(([o, c]) => `${o}–${c}`).join(', ')
                        : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}

      {prayerNearby.length > 0 && (
        <section>
          <h2 className="mb-3 font-semibold">{t('place.prayerNearby')}</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {prayerNearby.map((p) => (
              <PlaceCard key={p.id} place={p} />
            ))}
          </div>
        </section>
      )}

      {nearby.length > 0 && (
        <section>
          <h2 className="mb-3 font-semibold">{t('place.nearbyPlaces')}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {nearby.map((p) => (
              <PlaceCard key={p.id} place={p} />
            ))}
          </div>
        </section>
      )}

      <section id="reviews">
        <h2 className="mb-3 font-semibold">{t('review.title')}</h2>
        <div className="mb-4">
          <ReviewForm placeId={place.id} />
        </div>
        {publishedReviews.length > 0 && (
          <p className="mb-3 text-xs opacity-60">
            {t('review.disclaimer')}{' '}
            <a href={`/${locale}/legal/takedown`} className="underline">
              {t('review.reportReview')}
            </a>
          </p>
        )}
        {publishedReviews.length === 0 ? (
          <p className="text-sm opacity-60">{t('review.empty')}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {publishedReviews.map((r) => (
              <li key={r.id} className="rounded-xl border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{r.authorName}</span>
                  <span className="text-amber-500" aria-label={`${r.rating}`}>
                    {'★'.repeat(r.rating)}
                    <span className="text-gray-300">{'★'.repeat(5 - r.rating)}</span>
                  </span>
                </div>
                {r.body && <p className="mt-1 text-sm opacity-80">{r.body}</p>}
                <p className="mt-1 text-xs opacity-50">
                  {format.dateTime(r.createdAt, { dateStyle: 'medium' })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className="border-t pt-3 text-xs opacity-60">
        {place.lastVerifiedAt && (
          <p>
            {t('place.lastVerified', {
              date: format.dateTime(place.lastVerifiedAt, { dateStyle: 'medium' }),
            })}
          </p>
        )}
        <p>{t('place.dataSource', { source: place.dataSource })}</p>
        {!place.ownerUserId && (
          <div className="mt-2">
            <ClaimButton slug={place.slug} />
          </div>
        )}
      </footer>
    </main>
  );
}
