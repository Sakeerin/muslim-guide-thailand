import { getTranslations } from 'next-intl/server';
import { countDevices, countSubscriptions } from '@/server/services/push';
import { broadcastAnnouncementAction } from '@/app/admin/(protected)/actions';
import { getAdminLocale } from '@/server/admin-locale';

export const dynamic = 'force-dynamic';

// Locale endonyms — not translated (a language is always named in itself).
const LOCALES: { code: string; label: string }[] = [
  { code: 'th', label: 'ไทย' },
  { code: 'en', label: 'English' },
  { code: 'ms', label: 'Melayu' },
  { code: 'id', label: 'Indonesia' },
  { code: 'ar', label: 'العربية' },
];

export default async function AdminAnnouncePage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; failed?: string; pruned?: string; total?: string; error?: string }>;
}) {
  const locale = await getAdminLocale();
  const [t, count, devices, sp] = await Promise.all([
    getTranslations({ locale, namespace: 'admin.announce' }),
    countSubscriptions(),
    countDevices(),
    searchParams,
  ]);

  return (
    <main className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">
        {t('title', { web: String(count), app: String(devices) })}
      </h1>
      <p className="rounded-xl bg-foreground/5 p-3 text-sm">
        {t.rich('note', { strong: (chunks) => <strong>{chunks}</strong> })}
      </p>

      {sp.sent !== undefined && (
        <p className="rounded-lg border border-emerald-500/40 bg-emerald-50 p-3 text-sm dark:bg-emerald-950/30">
          {t('result', {
            sent: sp.sent,
            failed: sp.failed ?? '',
            pruned: sp.pruned ?? '',
            total: sp.total ?? '',
          })}
        </p>
      )}
      {sp.error === 'missing' && (
        <p className="rounded-lg border border-red-500/40 bg-red-50 p-3 text-sm dark:bg-red-950/30">
          {t('errorMissing')}
        </p>
      )}

      <form action={broadcastAnnouncementAction} className="flex flex-col gap-4 rounded-xl border p-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-sm">
            {t('topicLabel')}
            <select name="topic" className="rounded border bg-background px-2 py-1">
              <option value="">{t('topicAll')}</option>
              <option value="ramadan">ramadan</option>
              <option value="eid">eid</option>
              <option value="events">events</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t('pathLabel')}
            <input name="path" defaultValue="/ramadan" className="rounded border bg-background px-2 py-1" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t('tagLabel')}
            <input name="tag" placeholder="ramadan-2026" className="rounded border bg-background px-2 py-1" />
          </label>
        </div>

        <div className="grid gap-3">
          {LOCALES.map((l) => (
            <div key={l.code} className="grid grid-cols-[5rem_1fr_2fr] items-center gap-2" dir={l.code === 'ar' ? 'rtl' : 'ltr'}>
              <span className="text-sm opacity-70">{l.label}</span>
              <input
                name={`title_${l.code}`}
                placeholder={t('titlePlaceholder')}
                className="rounded border bg-background px-2 py-1 text-sm"
              />
              <input
                name={`body_${l.code}`}
                placeholder={t('bodyPlaceholder')}
                className="rounded border bg-background px-2 py-1 text-sm"
              />
            </div>
          ))}
        </div>

        <button className="self-start rounded-lg border px-4 py-1.5 text-sm font-medium hover:bg-foreground/5">
          {t('send')}
        </button>
      </form>
    </main>
  );
}
