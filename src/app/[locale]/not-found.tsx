'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

// Localized 404 for explicit notFound() calls in [locale] pages (place / city /
// category / prayer-times). Renders inside the locale layout, so the intl
// provider + current locale are available.
export default function NotFound() {
  const t = useTranslations('errors');

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-20 text-center">
      <h1 className="text-2xl font-bold">{t('notFoundTitle')}</h1>
      <p className="opacity-70">{t('notFound')}</p>
      <Link
        href="/"
        className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-foreground/5"
      >
        {t('backHome')}
      </Link>
    </main>
  );
}
