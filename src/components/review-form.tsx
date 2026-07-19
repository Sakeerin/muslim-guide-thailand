'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { useSession } from '@/lib/auth-client';
import { errorMessageKey } from '@/lib/api-errors';

type State = 'idle' | 'submitting' | 'published' | 'held';

export function ReviewForm({ placeId }: { placeId: string }) {
  const t = useTranslations('review');
  const tAuth = useTranslations('auth');
  const tErr = useTranslations('errors');
  const locale = useLocale();
  const router = useRouter();
  const { data: session, isPending } = useSession();

  const [rating, setRating] = useState(5);
  const [body, setBody] = useState('');
  const [state, setState] = useState<State>('idle');
  // i18n leaf key (in the `errors` namespace) of the current error, or null.
  const [errorKey, setErrorKey] = useState<string | null>(null);

  if (isPending) return null;

  if (!session) {
    return (
      <Link href="/login" className="inline-block rounded-lg border px-4 py-2 text-sm font-medium hover:bg-foreground/5">
        {tAuth('loginToReview')}
      </Link>
    );
  }

  if (state === 'published' || state === 'held') {
    return (
      <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
        {state === 'published' ? t('submitted') : t('held')}
      </p>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState('submitting');
    setErrorKey(null);
    try {
      const res = await fetch('/api/v1/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placeId, rating, body: body.trim() || undefined, lang: locale }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setState('idle');
        setErrorKey(errorMessageKey(json?.error?.code));
        return;
      }
      setState(json.data.status === 'published' ? 'published' : 'held');
      if (json.data.status === 'published') router.refresh();
    } catch {
      setState('idle');
      setErrorKey('network');
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 rounded-xl border p-4">
      <p className="text-xs opacity-70">{t('guidelines')}</p>
      <div className="flex items-center gap-2">
        <span className="text-sm">{t('rating')}</span>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            type="button"
            key={n}
            aria-label={`${n}`}
            onClick={() => setRating(n)}
            className={`text-2xl ${n <= rating ? 'text-amber-500' : 'text-gray-300'}`}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={2000}
        rows={3}
        placeholder={t('reviewPlaceholder')}
        className="rounded-lg border bg-background px-3 py-2 text-sm"
      />
      {errorKey && <p className="text-sm text-red-600">{tErr(errorKey)}</p>}
      <button
        type="submit"
        disabled={state === 'submitting'}
        className="self-start rounded-lg border px-4 py-2 text-sm font-medium hover:bg-foreground/5 disabled:opacity-50"
      >
        {t('submit')}
      </button>
    </form>
  );
}
