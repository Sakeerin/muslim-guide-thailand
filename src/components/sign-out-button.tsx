'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { authClient } from '@/lib/auth-client';

export function SignOutButton() {
  const t = useTranslations('auth');
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await authClient.signOut();
        router.push('/');
        router.refresh();
      }}
      className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-foreground/5"
    >
      {t('signOut')}
    </button>
  );
}
