import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { alternatesFor } from '@/lib/seo';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'footer' });
  return { title: t('terms'), alternates: alternatesFor('/legal/terms') };
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'footer' });

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 py-10">
      <h1 className="text-3xl font-bold">{t('terms')}</h1>
      <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
        {locale === 'th'
          ? '(ฉบับร่าง — ต้องให้ที่ปรึกษากฎหมายตรวจก่อนเปิดตัวจริง)'
          : '(Draft — must be reviewed by legal counsel before launch.)'}
      </p>
    </main>
  );
}
