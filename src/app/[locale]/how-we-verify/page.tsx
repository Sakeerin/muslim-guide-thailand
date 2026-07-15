import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { alternatesFor } from '@/lib/seo';
import { HalalBadge } from '@/components/halal-badge';

const LEVELS = ['cicot_certified', 'muslim_owned', 'muslim_friendly', 'unverified'] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'trust' });
  return { title: t('howWeVerify'), alternates: alternatesFor('/how-we-verify') };
}

/**
 * The brand's most important page: explains the 4 trust levels, what
 * evidence each requires, and the platform's disclaimer. This page is the
 * public contract behind every badge.
 */
export default async function HowWeVerifyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'trust' });

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10">
      <h1 className="text-3xl font-bold">{t('howWeVerify')}</h1>

      <div className="flex flex-col gap-4">
        {LEVELS.map((level) => (
          <section key={level} className="rounded-xl border p-4">
            <HalalBadge status={level} />
            <p className="mt-2 text-sm opacity-80">{t(`${level}_desc`)}</p>
          </section>
        ))}
      </div>

      <p className="rounded-xl bg-foreground/5 p-4 text-sm opacity-80">{t('disclaimer')}</p>
    </main>
  );
}
