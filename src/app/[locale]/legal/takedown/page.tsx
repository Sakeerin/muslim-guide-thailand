import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { alternatesFor } from '@/lib/seo';

const CONTENT_TYPES = ['place', 'media', 'review'] as const;
type ContentType = (typeof CONTENT_TYPES)[number];
const TYPE_LABEL_KEY: Record<ContentType, 'typePlace' | 'typeMedia' | 'typeReview'> = {
  place: 'typePlace',
  media: 'typeMedia',
  review: 'typeReview',
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'footer' });
  return { title: t('takedown'), alternates: alternatesFor('/legal/takedown') };
}

/**
 * Public notice-and-takedown channel (MDES). The no-JS form posts to
 * /api/v1/takedowns/form, which starts the 24h SLA clock and redirects back
 * with ?status=received|error. "Report" links elsewhere deep-link here with
 * ?type=&id= so the content reference is filled in (users never see the UUID).
 */
export default async function TakedownPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string; type?: string; id?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { status, type, id } = await searchParams;
  const t = await getTranslations({ locale, namespace: 'takedown' });
  const tf = await getTranslations({ locale, namespace: 'footer' });

  const prefillType = CONTENT_TYPES.includes(type as ContentType) ? (type as ContentType) : null;
  const prefillId = prefillType && id ? id : null;

  // Submitted successfully → confirmation only (no form to re-submit).
  if (status === 'received') {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10">
        <h1 className="text-3xl font-bold">{tf('takedown')}</h1>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
          <p className="font-semibold">{t('successTitle')}</p>
          <p className="mt-1 text-sm">{t('success')}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10">
      <h1 className="text-3xl font-bold">{tf('takedown')}</h1>
      <p className="opacity-80">{t('intro')}</p>

      {status === 'error' && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{t('error')}</p>
      )}

      <form method="POST" action="/api/v1/takedowns/form" className="flex flex-col gap-4">
        {prefillType && prefillId ? (
          // Deep-linked from a "Report" affordance — carry the reference, show a
          // human-readable summary instead of the raw UUID.
          <>
            <input type="hidden" name="contentType" value={prefillType} />
            <input type="hidden" name="contentId" value={prefillId} />
            <p className="rounded-lg bg-foreground/5 p-3 text-sm">
              {t('reporting', { type: t(TYPE_LABEL_KEY[prefillType]) })}
            </p>
          </>
        ) : (
          <>
            <label className="flex flex-col gap-1 text-sm">
              {t('contentType')}
              <select name="contentType" className="rounded-lg border bg-background px-3 py-2">
                <option value="place">{t('typePlace')}</option>
                <option value="media">{t('typeMedia')}</option>
                <option value="review">{t('typeReview')}</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              {t('contentId')}
              <input name="contentId" required className="rounded-lg border bg-background px-3 py-2" />
              <span className="text-xs opacity-60">{t('contentIdHint')}</span>
            </label>
          </>
        )}

        <label className="flex flex-col gap-1 text-sm">
          {t('requesterName')}
          <input name="requesterName" className="rounded-lg border bg-background px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t('requesterContact')}
          <input
            name="requesterContact"
            required
            className="rounded-lg border bg-background px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t('reason')}
          <textarea
            name="reason"
            required
            rows={4}
            className="rounded-lg border bg-background px-3 py-2"
          />
        </label>

        {/* honeypot — bots fill it, humans never see it */}
        <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="affirmTruth" value="true" required className="mt-1" />
          <span>{t('affirm')}</span>
        </label>
        <button className="rounded-lg border px-6 py-2 font-medium hover:bg-foreground/5">
          {t('submit')}
        </button>
      </form>
    </main>
  );
}
