import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { auth, isStaff } from '@/server/auth';
import { getAdminLocale } from '@/server/admin-locale';
import { isRtl, routing } from '@/i18n/routing';
import { AdminLocaleSwitcher } from '@/components/admin/locale-switcher';

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !isStaff((session.user as { role?: string }).role)) {
    redirect('/admin/login');
  }

  const locale = await getAdminLocale();
  const t = await getTranslations({ locale, namespace: 'admin.nav' });

  const links = [
    { href: '/admin/places', label: t('places') },
    { href: '/admin/verification', label: t('verification') },
    { href: '/admin/certificates', label: t('certificates') },
    { href: '/admin/import', label: t('import') },
    { href: '/admin/featured', label: t('featured') },
    { href: '/admin/announce', label: t('announce') },
    { href: '/admin/reviews', label: t('reviews') },
    { href: '/admin/qa', label: t('qa') },
    { href: '/admin/merchant', label: t('merchant') },
    { href: '/admin/submissions', label: t('submissions') },
    { href: '/admin/takedowns', label: t('takedowns') },
  ];

  return (
    <div dir={isRtl(locale) ? 'rtl' : 'ltr'}>
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-4 px-4 py-3">
          <Link href="/admin" className="font-bold">
            {t('home')}
          </Link>
          <nav className="flex flex-wrap gap-4 text-sm">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="hover:underline">
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="ms-auto flex items-center gap-3">
            <AdminLocaleSwitcher current={locale} locales={routing.locales} label={t('language')} />
            <span className="text-sm opacity-60">
              {session.user.name} ({(session.user as { role?: string }).role})
            </span>
          </div>
        </div>
      </header>
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</div>
    </div>
  );
}
