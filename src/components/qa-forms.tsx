'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { useSession } from '@/lib/auth-client';
import { errorMessageKey } from '@/lib/api-errors';

type State = 'idle' | 'submitting' | 'published' | 'held';

/** Shared question/answer submit form. List rendering stays server-side (place
 *  page); only the interactive form is a client component (like ReviewForm). */
function QaForm({
  endpoint,
  extra,
  placeholder,
  submitLabel,
  publishedMsg,
  heldMsg,
  loginLabel,
  maxLength,
  rows = 3,
}: {
  endpoint: string;
  extra: Record<string, string>;
  placeholder: string;
  submitLabel: string;
  publishedMsg: string;
  heldMsg: string;
  loginLabel: string;
  maxLength: number;
  rows?: number;
}) {
  const tErr = useTranslations('errors');
  const locale = useLocale();
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [body, setBody] = useState('');
  const [state, setState] = useState<State>('idle');
  const [errorKey, setErrorKey] = useState<string | null>(null);

  if (isPending) return null;

  if (!session) {
    return (
      <Link href="/login" className="text-sm underline">
        {loginLabel}
      </Link>
    );
  }

  if (state === 'published' || state === 'held') {
    return (
      <p className="rounded-lg bg-emerald-50 p-2 text-sm text-emerald-800">
        {state === 'published' ? publishedMsg : heldMsg}
      </p>
    );
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    setState('submitting');
    setErrorKey(null);
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...extra, body: body.trim(), lang: locale }),
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
    <form onSubmit={onSubmit} className="flex flex-col gap-2">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={rows}
        maxLength={maxLength}
        placeholder={placeholder}
        className="rounded-lg border bg-background px-3 py-2 text-sm"
      />
      {errorKey && <p className="text-sm text-red-600">{tErr(errorKey)}</p>}
      <button
        type="submit"
        disabled={state === 'submitting'}
        className="self-start rounded-lg border px-4 py-1.5 text-sm font-medium hover:bg-foreground/5 disabled:opacity-50"
      >
        {submitLabel}
      </button>
    </form>
  );
}

export function AskQuestionForm({ placeId }: { placeId: string }) {
  const t = useTranslations('qa');
  return (
    <QaForm
      endpoint="/api/v1/questions"
      extra={{ placeId }}
      placeholder={t('askPlaceholder')}
      submitLabel={t('submitQuestion')}
      publishedMsg={t('questionSubmitted')}
      heldMsg={t('questionHeld')}
      loginLabel={t('loginToAsk')}
      maxLength={1000}
    />
  );
}

export function AnswerForm({ questionId }: { questionId: string }) {
  const t = useTranslations('qa');
  return (
    <QaForm
      endpoint="/api/v1/answers"
      extra={{ questionId }}
      placeholder={t('answerPlaceholder')}
      submitLabel={t('submitAnswer')}
      publishedMsg={t('answerSubmitted')}
      heldMsg={t('answerHeld')}
      loginLabel={t('loginToAnswer')}
      maxLength={2000}
      rows={2}
    />
  );
}
