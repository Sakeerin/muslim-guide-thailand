import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { listPendingReviews } from '@/server/services/reviews';
import {
  approveReviewAction,
  hideReviewAction,
  removeReviewAction,
} from '@/app/admin/(protected)/actions';
import { getAdminLocale } from '@/server/admin-locale';

export const dynamic = 'force-dynamic';

export default async function AdminReviewsPage() {
  const locale = await getAdminLocale();
  const t = await getTranslations({ locale, namespace: 'admin.reviews' });
  const queue = await listPendingReviews();
  const dateFmt = new Intl.DateTimeFormat(locale, {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'Asia/Bangkok',
  });

  return (
    <main className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">{t('title', { count: String(queue.length) })}</h1>
      <p className="rounded-xl bg-foreground/5 p-3 text-sm">
        {t.rich('note', { strong: (chunks) => <strong>{chunks}</strong> })}
      </p>

      <div className="flex flex-col gap-3">
        {queue.map((r) => (
          <div key={r.id} className={`rounded-xl border p-4 ${r.riskFlag ? 'border-red-300 bg-red-50' : ''}`}>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {r.riskFlag && (
                <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
                  {t('riskFlag')}
                </span>
              )}
              <span className="text-amber-500">{'★'.repeat(r.rating)}</span>
              <span className="opacity-70">{r.authorName}</span>
              <Link href={`/th/place/${r.placeSlug}`} target="_blank" className="underline opacity-70">
                {(r.placeName as Record<string, string>).th ?? (r.placeName as Record<string, string>).en}
              </Link>
              <span className="text-xs opacity-50">{dateFmt.format(r.createdAt)}</span>
            </div>
            {r.body && <p className="mt-2 whitespace-pre-wrap text-sm">{r.body}</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              <form action={approveReviewAction}>
                <input type="hidden" name="reviewId" value={r.id} />
                <button className="rounded-lg border border-emerald-300 px-3 py-1.5 text-sm text-emerald-800 hover:bg-emerald-50">
                  {t('approve')}
                </button>
              </form>
              <form action={hideReviewAction}>
                <input type="hidden" name="reviewId" value={r.id} />
                <button className="rounded-lg border px-3 py-1.5 text-sm hover:bg-foreground/5">{t('hide')}</button>
              </form>
              <form action={removeReviewAction}>
                <input type="hidden" name="reviewId" value={r.id} />
                <button className="rounded-lg border px-3 py-1.5 text-sm text-red-700 hover:bg-red-50">{t('remove')}</button>
              </form>
            </div>
          </div>
        ))}
        {queue.length === 0 && (
          <p className="rounded-xl border p-6 text-center opacity-60">{t('empty')}</p>
        )}
      </div>
    </main>
  );
}
