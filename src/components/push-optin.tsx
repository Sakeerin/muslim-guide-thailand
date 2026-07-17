'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { urlBase64ToUint8Array } from '@/lib/push';

type State =
  | 'loading'
  | 'unsupported'
  | 'ios-needs-install'
  | 'default' // supported, not yet subscribed
  | 'granted' // subscribed
  | 'denied' // permission blocked
  | 'busy';

const VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function isIos(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari exposes this non-standard flag on installed PWAs
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

/**
 * Ramadan/Eid push opt-in. Anonymous — no login needed. Permission is requested
 * only inside the click handler (a user gesture), as browsers require. On iOS,
 * push works only for a home-screen-installed PWA, so we show install
 * instructions instead of a button when running in a normal Safari tab.
 */
export function PushOptIn() {
  const t = useTranslations('push');
  const locale = useLocale();
  const [state, setState] = useState<State>('loading');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!VAPID_KEY || !('serviceWorker' in navigator) || !('PushManager' in window)) {
        if (!cancelled) setState(isIos() && !isStandalone() ? 'ios-needs-install' : 'unsupported');
        return;
      }
      if (isIos() && !isStandalone()) {
        if (!cancelled) setState('ios-needs-install');
        return;
      }
      if (Notification.permission === 'denied') {
        if (!cancelled) setState('denied');
        return;
      }
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        const sub = await reg?.pushManager.getSubscription();
        if (!cancelled) setState(sub ? 'granted' : 'default');
      } catch {
        if (!cancelled) setState('default');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const enable = useCallback(async () => {
    if (!VAPID_KEY) return;
    setState('busy');
    try {
      // register is idempotent — returns the existing SW if already registered
      await navigator.serviceWorker.register('/sw.js');
      const reg = await navigator.serviceWorker.ready;
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setState(permission === 'denied' ? 'denied' : 'default');
        return;
      }
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_KEY),
        }));
      const res = await fetch('/api/v1/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub.toJSON(), locale }),
      });
      setState(res.ok ? 'granted' : 'default');
    } catch {
      setState('default');
    }
  }, [locale]);

  const disable = useCallback(async () => {
    setState('busy');
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await fetch('/api/v1/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
    } catch {
      /* best-effort */
    }
    setState('default');
  }, []);

  if (state === 'loading' || state === 'unsupported') return null;

  return (
    <section className="rounded-xl border p-4">
      <p className="font-medium">🔔 {t('title')}</p>
      <p className="mt-1 text-sm opacity-70">{t('intro')}</p>

      {state === 'ios-needs-install' && (
        <p className="mt-3 text-sm opacity-80">{t('iosHint')}</p>
      )}
      {state === 'denied' && <p className="mt-3 text-sm opacity-80">{t('blocked')}</p>}
      {state === 'granted' && (
        <div className="mt-3 flex items-center gap-3">
          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
            ✓ {t('enabled')}
          </span>
          <button
            onClick={disable}
            className="rounded-lg border px-3 py-1.5 text-sm hover:bg-foreground/5"
          >
            {t('disable')}
          </button>
        </div>
      )}
      {(state === 'default' || state === 'busy') && (
        <button
          onClick={enable}
          disabled={state === 'busy'}
          className="mt-3 rounded-lg border px-4 py-1.5 text-sm font-medium hover:bg-foreground/5 disabled:opacity-50"
        >
          {t('enable')}
        </button>
      )}
    </section>
  );
}
