'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';

/**
 * Admin sign-in form. The admin tree has no NextIntlClientProvider (it runs in
 * the cookie-based admin locale, not the public `[locale]` segment), so this
 * client component receives already-translated strings as props from the server
 * page rather than calling useTranslations itself.
 */
export function AdminLoginForm({
  dir,
  title,
  emailLabel,
  passwordLabel,
  signIn,
  signingIn,
  invalidCredentials,
}: {
  dir: 'rtl' | 'ltr';
  title: string;
  emailLabel: string;
  passwordLabel: string;
  signIn: string;
  signingIn: string;
  invalidCredentials: string;
}) {
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
      setError(invalidCredentials);
    } else {
      router.push('/admin');
      router.refresh();
    }
  };

  return (
    <main dir={dir} className="flex flex-1 items-center justify-center p-4">
      <form onSubmit={submit} className="flex w-full max-w-sm flex-col gap-4 rounded-xl border p-6">
        <h1 className="text-xl font-bold">{title}</h1>
        <label className="flex flex-col gap-1 text-sm">
          {emailLabel}
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border bg-background px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {passwordLabel}
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border bg-background px-3 py-2"
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg border px-4 py-2 font-medium hover:bg-foreground/5 disabled:opacity-50"
        >
          {loading ? signingIn : signIn}
        </button>
      </form>
    </main>
  );
}
