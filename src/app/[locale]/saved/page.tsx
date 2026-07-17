'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useSavedPlaces } from '@/lib/saved-places';
import { PushOptIn } from '@/components/push-optin';

export default function SavedPage() {
  const t = useTranslations('saved');
  const entries = useSavedPlaces();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10">
      <h1 className="text-3xl font-bold">{t('title')}</h1>

      <PushOptIn />

      {entries.length === 0 ? (
        <div className="rounded-xl border p-8 text-center">
          <p className="font-medium">{t('empty')}</p>
          <p className="mt-2 text-sm opacity-70">{t('emptyHint')}</p>
          <p className="mt-2 text-sm opacity-70">{t('installHint')}</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {entries.map((e) => (
            <li key={e.slug}>
              <Link
                href={`/place/${e.slug}`}
                className="block rounded-xl border p-4 font-medium hover:bg-foreground/5"
              >
                {e.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
