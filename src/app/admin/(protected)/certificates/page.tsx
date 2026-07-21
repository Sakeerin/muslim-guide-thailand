import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { listAllPlacesForAdmin } from '@/server/services/moderation';
import {
  listExpiringCertifications,
  listPendingCertifications,
} from '@/server/services/certifications';
import {
  createCertificationAction,
  verifyCertificationAction,
  rejectCertificationAction,
} from '@/app/admin/(protected)/actions';
import { getAdminLocale } from '@/server/admin-locale';
import { expiryBucket } from '@/lib/trust';

export const dynamic = 'force-dynamic';

// CSS per expiry bucket — presentation only, not translated.
const BUCKET_CLS: Record<string, string> = {
  expired: 'bg-red-100 text-red-800',
  lte30: 'bg-red-100 text-red-800',
  lte60: 'bg-amber-100 text-amber-900',
  lte90: 'bg-yellow-50 text-yellow-800',
  later: 'bg-foreground/5',
};

export default async function CertificatesPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; error?: string }>;
}) {
  const { created, error } = await searchParams;
  const locale = await getAdminLocale();
  const t = await getTranslations({ locale, namespace: 'admin.certificates' });
  const [places, pending, expiring] = await Promise.all([
    listAllPlacesForAdmin(),
    listPendingCertifications(),
    listExpiringCertifications(90),
  ]);

  // Bucket label keyed by expiryBucket() result; resolved via literal t() keys.
  const bucketLabel: Record<string, string> = {
    expired: t('bucketExpired'),
    lte30: t('bucketLte30'),
    lte60: t('bucketLte60'),
    lte90: t('bucketLte90'),
    later: t('bucketLater'),
  };

  return (
    <main className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{t('title')}</h1>
      {created && <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{t('created')}</p>}
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{t('error')}</p>}

      <section className="rounded-xl border p-4">
        <h2 className="mb-3 font-semibold">{t('addTitle')}</h2>
        <form action={createCertificationAction} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm">
            {t('place')}
            <select name="placeId" required className="rounded border bg-background px-2 py-1">
              <option value="">{t('selectPlace')}</option>
              {places.map((p) => (
                <option key={p.id} value={p.id}>
                  {(p.name as Record<string, string>).th ?? (p.name as Record<string, string>).en}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t('certifyingBody')}
            <input name="certifyingBody" defaultValue="CICOT" className="rounded border bg-background px-2 py-1" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t('certNumber')}
            <input name="certNumber" className="rounded border bg-background px-2 py-1" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t('issuedAt')}
            <input type="date" name="issuedAt" className="rounded border bg-background px-2 py-1" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t('expiresAt')}
            <input type="date" name="expiresAt" className="rounded border bg-background px-2 py-1" />
          </label>
          <div className="flex items-end">
            <button className="rounded-lg border px-4 py-1.5 text-sm hover:bg-foreground/5">{t('add')}</button>
          </div>
        </form>
        <p className="mt-2 text-xs opacity-60">{t('addNote')}</p>
      </section>

      <section>
        <h2 className="mb-3 font-semibold">{t('pendingTitle', { count: String(pending.length) })}</h2>
        <div className="flex flex-col gap-2">
          {pending.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center gap-3 rounded-lg border p-3 text-sm">
              <span className="font-medium">
                {(c.placeName as Record<string, string>).th ?? (c.placeName as Record<string, string>).en}
              </span>
              <span className="opacity-70">
                {c.certifyingBody} {c.certNumber ?? ''}{' '}
                {c.expiresAt ? `· ${t('expires', { date: String(c.expiresAt) })}` : ''}
              </span>
              <form action={verifyCertificationAction} className="ms-auto">
                <input type="hidden" name="certId" value={c.id} />
                <button className="rounded border border-emerald-300 px-3 py-1 text-emerald-800 hover:bg-emerald-50">
                  {t('verify')}
                </button>
              </form>
              <form action={rejectCertificationAction} className="flex gap-1">
                <input type="hidden" name="certId" value={c.id} />
                <input name="note" placeholder={t('reasonPlaceholder')} className="w-28 rounded border bg-background px-2 py-1" />
                <button className="rounded border px-3 py-1 hover:bg-foreground/5">{t('reject')}</button>
              </form>
            </div>
          ))}
          {pending.length === 0 && <p className="text-sm opacity-60">{t('pendingEmpty')}</p>}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-semibold">{t('expiringTitle', { count: String(expiring.length) })}</h2>
        <p className="mb-2 text-xs opacity-60">{t('expiringNote')}</p>
        <div className="flex flex-col gap-2">
          {expiring.map((c) => {
            const key = expiryBucket(c.daysLeft);
            return (
              <div key={c.id} className="flex flex-wrap items-center gap-3 rounded-lg border p-3 text-sm">
                <Link href={`/admin/places/${c.placeId}`} className="font-medium underline">
                  {c.placeName.th ?? c.placeName.en}
                </Link>
                <span className="opacity-70">
                  {c.certNumber ?? ''} · {t('expires', { date: String(c.expiresAt) })}
                </span>
                <span className={`ms-auto rounded-full px-2 py-0.5 text-xs ${BUCKET_CLS[key]}`}>
                  {bucketLabel[key]} ({t('daysLeft', { days: String(c.daysLeft) })})
                </span>
              </div>
            );
          })}
          {expiring.length === 0 && <p className="text-sm opacity-60">{t('expiringEmpty')}</p>}
        </div>
      </section>
    </main>
  );
}
