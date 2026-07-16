'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Link } from '@/i18n/navigation';
import { authClient } from '@/lib/auth-client';

export default function LoginPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await authClient.signIn.email({ email, password });
    setLoading(false);
    if (error) {
      setError(t('invalidCredentials'));
    } else {
      router.push('/account');
      router.refresh();
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-4 px-4 py-12">
      <h1 className="text-2xl font-bold">{t('signIn')}</h1>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          {t('email')}
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-lg border bg-background px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t('password')}
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="rounded-lg border bg-background px-3 py-2" />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading} className="rounded-lg border px-4 py-2 font-medium hover:bg-foreground/5 disabled:opacity-50">
          {loading ? '…' : t('signIn')}
        </button>
      </form>
      <Link href="/register" className="text-sm underline opacity-80">
        {t('noAccount')}
      </Link>
    </main>
  );
}
