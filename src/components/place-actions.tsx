'use client';

import { useTranslations } from 'next-intl';
import { toggleSavedPlace, useSavedPlaces } from '@/lib/saved-places';

export function PlaceActions({
  slug,
  name,
  lat,
  lng,
  phone,
  googleMapsUrl,
}: {
  slug: string;
  name: string;
  lat: number;
  lng: number;
  phone: string | null;
  googleMapsUrl: string | null;
}) {
  const t = useTranslations('common');
  const saved = useSavedPlaces().some((e) => e.slug === slug);

  const toggleSave = () => {
    toggleSavedPlace({ slug, name });
  };

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: name, url });
      } catch {
        /* user cancelled */
      }
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

  const mapsHref =
    googleMapsUrl ?? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  return (
    <div className="grid grid-cols-4 gap-2">
      <a
        href={mapsHref}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-lg border p-2 text-center text-sm font-medium hover:bg-foreground/5"
      >
        {t('navigate')}
      </a>
      {phone ? (
        <a
          href={`tel:${phone}`}
          className="rounded-lg border p-2 text-center text-sm font-medium hover:bg-foreground/5"
        >
          {t('call')}
        </a>
      ) : (
        <span className="rounded-lg border p-2 text-center text-sm opacity-40">{t('call')}</span>
      )}
      <button
        onClick={toggleSave}
        className={`rounded-lg border p-2 text-center text-sm font-medium hover:bg-foreground/5 ${saved ? 'bg-foreground/10' : ''}`}
      >
        {saved ? t('saved') : t('save')}
      </button>
      <button
        onClick={share}
        className="rounded-lg border p-2 text-center text-sm font-medium hover:bg-foreground/5"
      >
        {t('share')}
      </button>
    </div>
  );
}
