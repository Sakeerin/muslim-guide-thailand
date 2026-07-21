import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { listOwnerSubmissions } from '@/server/services/claims';
import {
  approveClaimAction,
  applyOwnerEditAction,
  rejectOwnerSubmissionAction,
} from '@/app/admin/(protected)/actions';
import { getAdminLocale } from '@/server/admin-locale';

export const dynamic = 'force-dynamic';

function renderVal(v: unknown): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

export default async function AdminMerchantPage() {
  const locale = await getAdminLocale();
  const t = await getTranslations({ locale, namespace: 'admin.merchant' });
  const queue = await listOwnerSubmissions();
  const claims = queue.filter((q) => q.category === 'claim');
  const edits = queue.filter((q) => q.category === 'place_edit');

  // Owner-editable field labels; LINE / Google Maps are brand names (literal).
  const fieldLabel: Record<string, string> = {
    description: t('fieldDescription'),
    address: t('fieldAddress'),
    phone: t('fieldPhone'),
    website: t('fieldWebsite'),
    lineId: 'LINE',
    googleMapsUrl: 'Google Maps',
    openingHours: t('fieldOpeningHours'),
    priceRange: t('fieldPriceRange'),
  };

  return (
    <main className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{t('title', { count: String(queue.length) })}</h1>

      <section>
        <h2 className="mb-3 font-semibold">{t('claimsTitle', { count: String(claims.length) })}</h2>
        <p className="mb-2 text-xs opacity-60">{t('claimsNote')}</p>
        <div className="flex flex-col gap-3">
          {claims.map((c) => {
            const p = c.payload as { contact?: string; message?: string };
            return (
              <div key={c.id} className="rounded-xl border p-4 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/th/place/${c.placeSlug}`} target="_blank" className="font-medium underline">
                    {(c.placeName as Record<string, string>)?.th ?? (c.placeName as Record<string, string>)?.en ?? c.placeSlug}
                  </Link>
                  <span className="opacity-60">
                    {t('requester', { name: c.submitterName ?? '—', email: c.submitterEmail ?? '' })}
                  </span>
                </div>
                <p className="mt-1">{t('contact', { contact: p.contact ?? '—' })}</p>
                {p.message && <p className="mt-1 opacity-80">{p.message}</p>}
                <div className="mt-3 flex gap-2">
                  <form action={approveClaimAction}>
                    <input type="hidden" name="submissionId" value={c.id} />
                    <button className="rounded-lg border border-emerald-300 px-3 py-1.5 text-emerald-800 hover:bg-emerald-50">
                      {t('approveClaim')}
                    </button>
                  </form>
                  <form action={rejectOwnerSubmissionAction}>
                    <input type="hidden" name="submissionId" value={c.id} />
                    <button className="rounded-lg border px-3 py-1.5 hover:bg-foreground/5">{t('reject')}</button>
                  </form>
                </div>
              </div>
            );
          })}
          {claims.length === 0 && <p className="text-sm opacity-60">{t('claimsEmpty')}</p>}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-semibold">{t('editsTitle', { count: String(edits.length) })}</h2>
        <div className="flex flex-col gap-3">
          {edits.map((e) => {
            const payload = e.payload as Record<string, unknown>;
            return (
              <div key={e.id} className="rounded-xl border p-4 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/th/place/${e.placeSlug}`} target="_blank" className="font-medium underline">
                    {(e.placeName as Record<string, string>)?.th ?? (e.placeName as Record<string, string>)?.en ?? e.placeSlug}
                  </Link>
                  <span className="opacity-60">{t('by', { name: e.submitterName ?? '—' })}</span>
                </div>
                <ul className="mt-2 flex flex-col gap-1">
                  {Object.entries(payload).map(([k, v]) => (
                    <li key={k}>
                      <span className="font-medium">{fieldLabel[k] ?? k}:</span>{' '}
                      <span className="opacity-80">{renderVal(v)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex gap-2">
                  <form action={applyOwnerEditAction}>
                    <input type="hidden" name="submissionId" value={e.id} />
                    <button className="rounded-lg border border-emerald-300 px-3 py-1.5 text-emerald-800 hover:bg-emerald-50">
                      {t('approveEdit')}
                    </button>
                  </form>
                  <form action={rejectOwnerSubmissionAction}>
                    <input type="hidden" name="submissionId" value={e.id} />
                    <button className="rounded-lg border px-3 py-1.5 hover:bg-foreground/5">{t('reject')}</button>
                  </form>
                </div>
              </div>
            );
          })}
          {edits.length === 0 && <p className="text-sm opacity-60">{t('editsEmpty')}</p>}
        </div>
      </section>
    </main>
  );
}
