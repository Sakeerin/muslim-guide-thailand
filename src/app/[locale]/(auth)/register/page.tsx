'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Link } from '@/i18n/navigation';
import { authClient } from '@/lib/auth-client';
import { recordReviewConsent } from '@/lib/review-consent';

export default function RegisterPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) {
      setError(t('consentRequired'));
      return;
    }
    setLoading(true);
    setError(null);
    const { error } = await authClient.signUp.email({ name, email, password });
    if (error) {
      setLoading(false);
      setError(t('signUpError'));
      return;
    }
    // record PDPA consent now that a session exists (best-effort)
    try {
      await recordReviewConsent();
    } catch {
      /* consent logging is best-effort; account is created */
    }
    setLoading(false);
    router.push('/account');
    router.refresh();
  };

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-4 px-4 py-12">
      <h1 className="text-2xl font-bold">{t('signUp')}</h1>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          {t('name')}
          <input required value={name} onChange={(e) => setName(e.target.value)} className="rounded-lg border bg-background px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t('email')}
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-lg border bg-background px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t('password')}
          <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="rounded-lg border bg-background px-3 py-2" />
        </label>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" />
          <span>{t('consent')}</span>
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading} className="rounded-lg border px-4 py-2 font-medium hover:bg-foreground/5 disabled:opacity-50">
          {loading ? '…' : t('signUp')}
        </button>
      </form>
      <Link href="/login" className="text-sm underline opacity-80">
        {t('haveAccount')}
      </Link>
    </main>
  );
}
