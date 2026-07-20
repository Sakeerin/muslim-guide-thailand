import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { listVerificationQueue } from '@/server/services/verification';
import { getAdminLocale } from '@/server/admin-locale';
import { verifyPlaceAction, rejectPlaceAction } from '@/app/admin/(protected)/actions';

export const dynamic = 'force-dynamic';

export default async function VerificationQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; verified?: string }>;
}) {
  const { error, verified } = await searchParams;
  const locale = await getAdminLocale();
  const t = await getTranslations({ locale, namespace: 'admin.verification' });
  const queue = await listVerificationQueue();

  // Built inside the component so labels resolve via literal t() keys. The
  // `value` maps 1:1 to the stored halal_status / verification_method enums.
  const halalStatuses = [
    { value: 'cicot_certified', label: t('statusCicot') },
    { value: 'muslim_owned', label: t('statusMuslimOwned') },
    { value: 'muslim_friendly', label: t('statusMuslimFriendly') },
    { value: 'unverified', label: t('statusUnverified') },
  ];
  const methods = [
    { value: 'site_visit', label: t('methodSiteVisit') },
    { value: 'phone', label: t('methodPhone') },
    { value: 'document', label: t('methodDocument') },
    { value: 'official_registry', label: t('methodRegistry') },
    { value: 'owner_attestation', label: t('methodOwner') },
  ];

  return (
    <main className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">{t('title', { count: String(queue.length) })}</h1>
      <p className="text-sm opacity-70">{t('note')}</p>

      {verified && (
        <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{t('verified')}</p>
      )}
      {error === 'four_eyes' && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{t('fourEyesError')}</p>
      )}

      <div className="flex flex-col gap-4">
        {queue.map((p) => (
          <div key={p.id} className="rounded-xl border p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Link href={`/admin/places/${p.id}`} className="font-medium underline">
                {(p.name as Record<string, string>).th ?? (p.name as Record<string, string>).en}
              </Link>
              <span className="text-xs opacity-50">{p.type} · {p.slug}</span>
            </div>

            <form action={verifyPlaceAction} className="mt-3 flex flex-wrap items-end gap-2">
              <input type="hidden" name="placeId" value={p.id} />
              <label className="flex flex-col gap-1 text-sm">
                {t('halalStatus')}
                <select name="halalStatus" defaultValue={p.halalStatus} className="rounded border bg-background px-2 py-1">
                  {halalStatuses.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm">
                {t('method')}
                <select name="verificationMethod" defaultValue="site_visit" className="rounded border bg-background px-2 py-1">
                  {methods.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </label>
              <button className="rounded-lg border border-emerald-300 px-4 py-1.5 text-sm text-emerald-800 hover:bg-emerald-50">
                {t('approve')}
              </button>
            </form>

            <form action={rejectPlaceAction} className="mt-2 flex flex-wrap items-end gap-2">
              <input type="hidden" name="placeId" value={p.id} />
              <input name="note" placeholder={t('rejectPlaceholder')} className="rounded border bg-background px-2 py-1 text-sm" />
              <button className="rounded-lg border px-4 py-1.5 text-sm hover:bg-foreground/5">
                {t('reject')}
              </button>
            </form>
          </div>
        ))}
        {queue.length === 0 && (
          <p className="rounded-xl border p-6 text-center opacity-60">{t('empty')}</p>
        )}
      </div>
    </main>
  );
}
