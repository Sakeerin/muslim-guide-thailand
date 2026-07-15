'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { qiblaBearing, distanceToKaabaKm } from '@/lib/prayer/qibla';

/**
 * Qibla display, sensor-free by default (works offline, works on iOS
 * without permissions): shows degrees from TRUE NORTH + distance.
 * A live device-orientation compass can be layered on later — the
 * numeric bearing always remains as fallback.
 */
export function QiblaFinder() {
  const t = useTranslations('qibla');
  const [state, setState] = useState<
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'ready'; degrees: number; distanceKm: number }
    | { status: 'error' }
  >({ status: 'idle' });

  const locate = () => {
    setState({ status: 'loading' });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // Coordinates are used in-browser only — never sent to the server (PDPA)
        const { latitude, longitude } = pos.coords;
        setState({
          status: 'ready',
          degrees: Math.round(qiblaBearing(latitude, longitude) * 10) / 10,
          distanceKm: Math.round(distanceToKaabaKm(latitude, longitude)),
        });
      },
      () => setState({ status: 'error' }),
      { enableHighAccuracy: true, timeout: 15_000 },
    );
  };

  return (
    <div className="flex flex-col items-center gap-6 rounded-xl border p-8 text-center">
      {state.status === 'ready' ? (
        <>
          <div
            className="flex h-40 w-40 items-center justify-center rounded-full border-4"
            role="img"
            aria-label={t('degreesFromNorth', { degrees: state.degrees })}
          >
            <div
              className="text-5xl"
              style={{ transform: `rotate(${state.degrees}deg)` }}
            >
              🕋
            </div>
          </div>
          <p className="text-2xl font-bold">
            {t('degreesFromNorth', { degrees: state.degrees })}
          </p>
          <p className="opacity-70">{t('distanceToKaaba', { km: state.distanceKm.toLocaleString() })}</p>
          <p className="text-sm opacity-60">{t('compassHint')}</p>
        </>
      ) : (
        <>
          <p className="opacity-70">{t('fallbackHint')}</p>
          <button
            onClick={locate}
            disabled={state.status === 'loading'}
            className="rounded-lg border px-6 py-3 font-medium hover:bg-foreground/5 disabled:opacity-50"
          >
            {state.status === 'loading' ? '…' : t('title')}
          </button>
          {state.status === 'error' && (
            <p className="text-sm text-amber-700">{t('permissionNeeded')}</p>
          )}
        </>
      )}
    </div>
  );
}
