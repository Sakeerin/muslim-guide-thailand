import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { LanguageSwitcher } from './language-switcher';

export function SiteHeader() {
  const t = useTranslations();

  return (
    <header className="border-b">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="text-lg font-bold">
          {t('common.appName')}
        </Link>
        <nav className="hidden items-center gap-4 text-sm sm:flex">
          <Link href="/search" className="hover:underline">
            {t('common.search')}
          </Link>
          <Link href="/prayer-times" className="hover:underline">
            {t('nav.prayerTimes')}
          </Link>
          <Link href="/qibla" className="hover:underline">
            {t('nav.qibla')}
          </Link>
          <Link href="/saved" className="hover:underline">
            {t('nav.saved')}
          </Link>
        </nav>
        <LanguageSwitcher />
      </div>
    </header>
  );
}
