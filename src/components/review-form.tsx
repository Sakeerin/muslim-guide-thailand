'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { useSession } from '@/lib/auth-client';
import { errorMessageKey } from '@/lib/api-errors';
import { recordReviewConsent } from '@/lib/review-consent';

type State = 'idle' | 'submitting' | 'published' | 'held';

export function ReviewForm({ placeId }: { placeId: string }) {
  const t = useTranslations('review');
  // root translator: errorKey is a full dotted path (errors.* or auth.*)
  const tMsg = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const { data: session, isPending } = useSession();

  const [rating, setRating] = useState(5);
  const [body, setBody] = useState('');
  const [state, setState] = useState<State>('idle');
  // full dotted i18n key of the current error, or null.
  const [errorKey, setErrorKey] = useState<string | null>(null);
  // First-time posters who signed IN (not up) may lack review_publication
  // consent; the server 403s and we surface an inline consent checkbox + retry.
  const [needsConsent, setNeedsConsent] = useState(false);
  const [consent, setConsent] = useState(false);

  if (isPending) return null;

  if (!session) {
    return (
      <Link href="/login" className="inline-block rounded-lg border px-4 py-2 text-sm font-medium hover:bg-foreground/5">
        {tMsg('auth.loginToReview')}
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
    // consent gate must be satisfied before we send anything
    if (needsConsent && !consent) {
      setErrorKey('auth.consentRequired');
      return;
    }
    setState('submitting');
    setErrorKey(null);
    try {
      if (needsConsent) await recordReviewConsent();
      const res = await fetch('/api/v1/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placeId, rating, body: body.trim() || undefined, lang: locale }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setState('idle');
        // signed-in-but-no-consent → reveal the inline checkbox so they can grant + retry
        if (json?.error?.code === 'consent_required') {
          setNeedsConsent(true);
          setErrorKey(null);
          return;
        }
        setErrorKey(errorMessageKey(json?.error?.code));
        return;
      }
      setState(json.data.status === 'published' ? 'published' : 'held');
      if (json.data.status === 'published') router.refresh();
    } catch {
      setState('idle');
      setErrorKey('errors.network');
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
      {needsConsent && (
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => {
              setConsent(e.target.checked);
              setErrorKey(null); // clear the "please accept" nudge the moment they comply
            }}
            className="mt-1"
          />
          <span>{tMsg('auth.consent')}</span>
        </label>
      )}
      {errorKey && <p className="text-sm text-red-600">{tMsg(errorKey)}</p>}
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
