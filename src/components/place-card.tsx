import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { resolveI18n } from '@/lib/i18n-content';
import { HalalBadge } from './halal-badge';
import type { PlaceListItem } from '@/server/services/places';

export function PlaceCard({ place }: { place: PlaceListItem }) {
  const locale = useLocale();
  const t = useTranslations();
  const name = resolveI18n(place.name as never, locale);
  const thaiName = (place.name as Record<string, string>).th;

  return (
    <Link
      href={`/place/${place.slug}`}
      className="flex flex-col gap-2 rounded-xl border p-4 transition hover:bg-foreground/5"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold">{name}</h3>
          {thaiName && thaiName !== name && (
            <p className="text-sm opacity-60">{thaiName}</p>
          )}
        </div>
        {place.openNow === true && (
          <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">
            {t('place.openNow')}
          </span>
        )}
        {place.openNow === false && (
          <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
            {t('place.closedNow')}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <HalalBadge status={place.halalStatus} />
        {place.priceRange && (
          <span className="text-xs opacity-60">{'฿'.repeat(place.priceRange)}</span>
        )}
        {typeof place.distanceM === 'number' && (
          <span className="text-xs opacity-60">
            {t('place.distanceKm', { km: (place.distanceM / 1000).toFixed(1) })}
          </span>
        )}
      </div>
    </Link>
  );
}
