'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useSession } from '@/lib/auth-client';

/** Session-aware header link: "Sign in" when logged out, "My account" when in. */
export function AccountNav() {
  const t = useTranslations('auth');
  const { data: session, isPending } = useSession();

  if (isPending) return null;

  return session ? (
    <Link href="/account" className="hover:underline">
      {t('account')}
    </Link>
  ) : (
    <Link href="/login" className="hover:underline">
      {t('signIn')}
    </Link>
  );
}
