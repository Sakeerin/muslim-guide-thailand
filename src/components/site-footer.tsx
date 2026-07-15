import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export function SiteFooter() {
  const t = useTranslations('footer');
  const tNav = useTranslations('nav');
  const year = new Date().getFullYear();

  return (
    <footer className="mt-12 border-t">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-6 text-sm opacity-70">
        <nav className="flex flex-wrap gap-4">
          <Link href="/how-we-verify" className="hover:underline">
            {tNav('howWeVerify')}
          </Link>
          <Link href="/legal/privacy" className="hover:underline">
            {t('privacy')}
          </Link>
          <Link href="/legal/terms" className="hover:underline">
            {t('terms')}
          </Link>
          <Link href="/legal/takedown" className="hover:underline">
            {t('takedown')}
          </Link>
        </nav>
        <p className="text-xs">{t('osmAttribution')}</p>
        <p className="text-xs">{t('copyright', { year })}</p>
      </div>
    </footer>
  );
}
