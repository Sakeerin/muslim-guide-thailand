'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { PlaceCard } from '@/components/place-card';
import type { PlaceListItem } from '@/server/services/places';

export default function NearbyPage() {
  const t = useTranslations();
  const [state, setState] = useState<
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'ready'; items: PlaceListItem[] }
    | { status: 'error' }
  >({ status: 'idle' });

  const locate = () => {
    setState({ status: 'loading' });
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          // one-off query — coordinates are not tied to any identity (PDPA)
          const res = await fetch(
            `/api/v1/places?lat=${pos.coords.latitude.toFixed(4)}&lng=${pos.coords.longitude.toFixed(4)}&radius=5000&limit=30`,
          );
          const json = (await res.json()) as { data: { items: PlaceListItem[] } };
          setState({ status: 'ready', items: json.data.items });
        } catch {
          setState({ status: 'error' });
        }
      },
      () => setState({ status: 'error' }),
      { enableHighAccuracy: true, timeout: 15_000 },
    );
  };

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-10">
      <h1 className="text-3xl font-bold">{t('common.nearMe')}</h1>

      {state.status !== 'ready' && (
        <div className="rounded-xl border p-8 text-center">
          <button
            onClick={locate}
            disabled={state.status === 'loading'}
            className="rounded-lg border px-6 py-3 font-medium hover:bg-foreground/5 disabled:opacity-50"
          >
            {state.status === 'loading' ? t('common.loading') : t('common.nearMe')}
          </button>
          {state.status === 'error' && (
            <p className="mt-3 text-sm text-amber-700">{t('errors.location')}</p>
          )}
        </div>
      )}

      {state.status === 'ready' &&
        (state.items.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {state.items.map((place) => (
              <PlaceCard key={place.id} place={place} />
            ))}
          </div>
        ) : (
          <p className="rounded-xl border p-6 text-center opacity-70">—</p>
        ))}
    </main>
  );
}
