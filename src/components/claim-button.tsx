'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useSession } from '@/lib/auth-client';
import { errorMessageKey } from '@/lib/api-errors';

type State = 'idle' | 'open' | 'submitting' | 'sent' | 'claimed';

/** "Own this place? Claim it" — login-gated claim form on the place page. */
export function ClaimButton({ slug }: { slug: string }) {
  const t = useTranslations('merchant');
  // root translator: errorKey is a full dotted path (errors.*)
  const tMsg = useTranslations();
  const { data: session, isPending } = useSession();
  const [state, setState] = useState<State>('idle');
  const [contact, setContact] = useState('');
  const [message, setMessage] = useState('');
  const [errorKey, setErrorKey] = useState<string | null>(null);

  if (isPending) return null;

  if (!session) {
    return (
      <Link href="/login" className="underline">
        {t('claimThisPlace')}
      </Link>
    );
  }

  if (state === 'sent') {
    return <p className="text-emerald-700">{t('claimSent')}</p>;
  }

  // Someone claimed it between page load and submit — say so instead of erroring.
  if (state === 'claimed') {
    return <p className="opacity-70">{t('alreadyClaimed')}</p>;
  }

  if (state !== 'open' && state !== 'submitting') {
    return (
      <button onClick={() => setState('open')} className="underline">
        {t('claimThisPlace')}
      </button>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState('submitting');
    setErrorKey(null);
    try {
      const res = await fetch(`/api/v1/places/${slug}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact, message: message || undefined }),
      });
      if (res.ok) {
        setState('sent');
        return;
      }
      const json = await res.json().catch(() => null);
      if (json?.error?.code === 'already_claimed') {
        setState('claimed');
        return;
      }
      setErrorKey(errorMessageKey(json?.error?.code));
      setState('open');
    } catch {
      setErrorKey('errors.network');
      setState('open');
    }
  };

  return (
    <form onSubmit={submit} className="mt-2 flex flex-col gap-2 rounded-lg border p-3 text-start">
      <p className="font-medium">{t('claimTitle')}</p>
      <p className="opacity-70">{t('claimIntro')}</p>
      <input
        required
        value={contact}
        onChange={(e) => setContact(e.target.value)}
        placeholder={t('contact')}
        className="rounded border bg-background px-2 py-1"
      />
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={t('message')}
        rows={2}
        className="rounded border bg-background px-2 py-1"
      />
      {errorKey && <p className="text-red-600">{tMsg(errorKey)}</p>}
      <button
        type="submit"
        disabled={state === 'submitting'}
        className="self-start rounded-lg border px-4 py-1.5 font-medium hover:bg-foreground/5 disabled:opacity-50"
      >
        {t('submitClaim')}
      </button>
    </form>
  );
}
