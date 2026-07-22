'use client';

import { useTranslations } from 'next-intl';

// Localized crash boundary for [locale] pages. Renders inside the locale layout
// (intl provider present); `reset` retries the failed render.
export default function LocaleError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('errors');

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-20 text-center">
      <h1 className="text-2xl font-bold">{t('pageErrorTitle')}</h1>
      <p className="opacity-70">{t('pageError')}</p>
      <button
        onClick={reset}
        className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-foreground/5"
      >
        {t('retry')}
      </button>
    </main>
  );
}
