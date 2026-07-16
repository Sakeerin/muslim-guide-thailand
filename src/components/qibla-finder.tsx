'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { qiblaBearing, distanceToKaabaKm } from '@/lib/prayer/qibla';

/**
 * Qibla display. Two layers, base always works:
 *  1. Sensor-free (default): degrees from TRUE NORTH + distance, computed
 *     offline from location. Works on iOS without permission and with no
 *     magnetometer — the flagship feature must never fail silently.
 *  2. Live compass (progressive enhancement): if DeviceOrientation is
 *     available (and permitted), rotate the arrow to point at the qibla
 *     relative to the device heading.
 */
export function QiblaFinder() {
  const t = useTranslations('qibla');
  const [state, setState] = useState<
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'ready'; bearing: number; distanceKm: number }
    | { status: 'error' }
  >({ status: 'idle' });
  const [heading, setHeading] = useState<number | null>(null);
  const [liveActive, setLiveActive] = useState(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  const locate = () => {
    setState({ status: 'loading' });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // coordinates stay in-browser — never sent to the server (PDPA)
        const { latitude, longitude } = pos.coords;
        setState({
          status: 'ready',
          bearing: Math.round(qiblaBearing(latitude, longitude) * 10) / 10,
          distanceKm: Math.round(distanceToKaabaKm(latitude, longitude)),
        });
      },
      () => setState({ status: 'error' }),
      { enableHighAccuracy: true, timeout: 15_000 },
    );
  };

  const onOrientation = useCallback((e: DeviceOrientationEvent) => {
    // webkitCompassHeading (iOS) is degrees clockwise from north.
    const iosHeading = (e as unknown as { webkitCompassHeading?: number }).webkitCompassHeading;
    if (typeof iosHeading === 'number') {
      setHeading(iosHeading);
    } else if (e.absolute && typeof e.alpha === 'number') {
      // alpha is counter-clockwise from north on most Android browsers
      setHeading((360 - e.alpha) % 360);
    }
  }, []);

  const startLiveCompass = async () => {
    type DOE = typeof DeviceOrientationEvent & { requestPermission?: () => Promise<'granted' | 'denied'> };
    const DOEvent = (window as unknown as { DeviceOrientationEvent?: DOE }).DeviceOrientationEvent;
    if (!DOEvent) return;

    try {
      if (typeof DOEvent.requestPermission === 'function') {
        const res = await DOEvent.requestPermission();
        if (res !== 'granted') return;
      }
      window.addEventListener('deviceorientationabsolute', onOrientation as EventListener);
      window.addEventListener('deviceorientation', onOrientation as EventListener);
      cleanupRef.current = () => {
        window.removeEventListener('deviceorientationabsolute', onOrientation as EventListener);
        window.removeEventListener('deviceorientation', onOrientation as EventListener);
      };
      setLiveActive(true);
    } catch {
      /* keep sensor-free display */
    }
  };

  useEffect(() => () => cleanupRef.current?.(), []);

  const supportsLive =
    typeof window !== 'undefined' && 'DeviceOrientationEvent' in window;

  // when live, rotate arrow to qibla relative to heading; else show absolute bearing
  const arrowRotation =
    state.status === 'ready'
      ? liveActive && heading !== null
        ? (state.bearing - heading + 360) % 360
        : state.bearing
      : 0;

  return (
    <div className="flex flex-col items-center gap-6 rounded-xl border p-8 text-center">
      {state.status === 'ready' ? (
        <>
          <div
            className="flex h-40 w-40 items-center justify-center rounded-full border-4"
            role="img"
            aria-label={t('degreesFromNorth', { degrees: state.bearing })}
          >
            <div className="text-5xl transition-transform" style={{ transform: `rotate(${arrowRotation}deg)` }}>
              🧭
            </div>
          </div>
          <p className="text-2xl font-bold">{t('degreesFromNorth', { degrees: state.bearing })}</p>
          <p className="opacity-70">{t('distanceToKaaba', { km: state.distanceKm.toLocaleString() })}</p>

          {liveActive ? (
            <p className="text-sm opacity-60">{t('compassHint')}</p>
          ) : supportsLive ? (
            <button onClick={startLiveCompass} className="rounded-lg border px-4 py-2 text-sm hover:bg-foreground/5">
              {t('title')} — live
            </button>
          ) : (
            <p className="text-sm opacity-60">{t('fallbackHint')}</p>
          )}
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
          {state.status === 'error' && <p className="text-sm text-amber-700">{t('permissionNeeded')}</p>}
        </>
      )}
    </div>
  );
}
