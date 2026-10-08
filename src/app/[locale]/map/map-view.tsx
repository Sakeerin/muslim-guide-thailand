'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { PlaceMap } from '@/components/place-map';

const TYPES = [
  { value: '', labelKey: 'typeAll' },
  { value: 'restaurant', labelKey: 'typeRestaurant' },
  { value: 'mosque', labelKey: 'typeMosque' },
  { value: 'prayer_room', labelKey: 'typePrayerRoom' },
];

export function MapView({ locale }: { locale: string }) {
  const t = useTranslations('common');
  const tPlace = useTranslations('place');
  const [type, setType] = useState('');

  return (
    <>
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">{t('viewMap')}</h1>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="ms-auto rounded-lg border bg-background px-3 py-1.5 text-sm"
        >
          {TYPES.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {tPlace(opt.labelKey)}
            </option>
          ))}
        </select>
      </div>
      <div className="h-[70vh]">
        {/* key forces a fresh map when the type filter changes */}
        <PlaceMap key={type} locale={locale} type={type || undefined} />
      </div>
    </>
  );
}
