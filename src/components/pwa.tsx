'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'mgt:install-dismissed';

/**
 * Registers the hand-written service worker (production only — in dev it would
 * interfere with HMR) and offers an install prompt. The banner appears only
 * after the browser fires beforeinstallprompt (install criteria met) and the
 * user hasn't dismissed it before.
 */
export function Pwa() {
  const t = useTranslations('saved');
  const [installEvt, setInstallEvt] = useState<BeforeInstallPromptEvent | null>(null);

  // event-handler (not called synchronously in an effect) — safe setState
  const onBeforeInstallPrompt = useCallback((e: Event) => {
    e.preventDefault();
    if (localStorage.getItem(DISMISS_KEY) === '1') return;
    setInstallEvt(e as BeforeInstallPromptEvent);
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
  }, [onBeforeInstallPrompt]);

  if (!installEvt) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-md items-center gap-3 rounded-xl border bg-background p-3 shadow-lg">
      <p className="flex-1 text-sm">{t('installHint')}</p>
      <button
        onClick={async () => {
          await installEvt.prompt();
          await installEvt.userChoice;
          setInstallEvt(null);
        }}
        className="rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-foreground/5"
      >
        {t('install')}
      </button>
      <button
        aria-label="dismiss"
        onClick={() => {
          localStorage.setItem(DISMISS_KEY, '1');
          setInstallEvt(null);
        }}
        className="rounded-lg px-2 py-1.5 text-sm opacity-60 hover:opacity-100"
      >
        ✕
      </button>
    </div>
  );
}
