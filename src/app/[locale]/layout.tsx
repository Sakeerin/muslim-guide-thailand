import type { Metadata } from 'next';
import { Noto_Sans, Noto_Sans_Arabic, Noto_Sans_Thai } from 'next/font/google';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { routing, isRtl } from '@/i18n/routing';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Pwa } from '@/components/pwa';
import { UmamiScript } from '@/components/umami-script';
import '../globals.css';

const notoSans = Noto_Sans({
  variable: '--font-sans',
  subsets: ['latin', 'latin-ext'],
});

const notoSansThai = Noto_Sans_Thai({
  variable: '--font-thai',
  subsets: ['thai'],
});

const notoSansArabic = Noto_Sans_Arabic({
  variable: '--font-arabic',
  subsets: ['arabic'],
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'common' });
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
    title: {
      default: t('appName'),
      template: `%s | ${t('appName')}`,
    },
    description: t('tagline'),
    manifest: '/manifest.webmanifest',
    alternates: {
      canonical: `/${locale}`,
      languages: Object.fromEntries(routing.locales.map((l) => [l, `/${l}`])),
    },
    openGraph: {
      type: 'website',
      siteName: t('appName'),
      locale: locale === 'th' ? 'th_TH' : locale === 'ar' ? 'ar_AR' : locale === 'ms' ? 'ms_MY' : locale === 'id' ? 'id_ID' : 'en_US',
    },
    appleWebApp: { capable: true, title: t('appName'), statusBarStyle: 'default' },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  return (
    <html
      lang={locale}
      dir={isRtl(locale) ? 'rtl' : 'ltr'}
      className={`${notoSans.variable} ${notoSansThai.variable} ${notoSansArabic.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <NextIntlClientProvider>
          <SiteHeader />
          {children}
          <SiteFooter />
          <Pwa />
        </NextIntlClientProvider>
        <UmamiScript />
      </body>
    </html>
  );
}
