import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { alternatesFor } from '@/lib/seo';
import { QiblaFinder } from '@/components/qibla-finder';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'qibla' });
  return { title: t('title'), alternates: alternatesFor('/qibla') };
}

export default async function QiblaPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'qibla' });

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-10">
      <h1 className="text-3xl font-bold">{t('title')}</h1>
      <QiblaFinder />
    </main>
  );
}
