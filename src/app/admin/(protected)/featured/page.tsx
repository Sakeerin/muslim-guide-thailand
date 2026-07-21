import { getTranslations } from 'next-intl/server';
import { listActiveFeatured, listFeaturablePlaces } from '@/server/services/featured';
import { setFeaturedAction, clearFeaturedAction } from '@/app/admin/(protected)/actions';
import { getAdminLocale } from '@/server/admin-locale';

export const dynamic = 'force-dynamic';

function nm(name: Record<string, string>): string {
  return name.th ?? name.en ?? Object.values(name)[0] ?? '—';
}

export default async function AdminFeaturedPage() {
  const locale = await getAdminLocale();
  const t = await getTranslations({ locale, namespace: 'admin.featured' });
  const [active, places] = await Promise.all([listActiveFeatured(), listFeaturablePlaces()]);
  const dateFmt = new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Bangkok',
  });

  return (
    <main className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{t('title', { count: String(active.length) })}</h1>
      <p className="rounded-xl bg-foreground/5 p-3 text-sm">
        {t.rich('note', { strong: (chunks) => <strong>{chunks}</strong> })}
      </p>

      <section className="rounded-xl border p-4">
        <h2 className="mb-3 font-semibold">{t('addTitle')}</h2>
        <form action={setFeaturedAction} className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-sm">
            {t('place')}
            <select name="placeId" required className="rounded border bg-background px-2 py-1">
              <option value="">{t('selectPlace')}</option>
              {places.map((p) => (
                <option key={p.id} value={p.id}>
                  {nm(p.name as Record<string, string>)} ({p.type})
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t('duration')}
            <input name="days" type="number" min="1" max="365" defaultValue="30" className="w-24 rounded border bg-background px-2 py-1" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t('noteField')}
            <input name="note" className="rounded border bg-background px-2 py-1" />
          </label>
          <button className="rounded-lg border px-4 py-1.5 text-sm hover:bg-foreground/5">{t('setFeatured')}</button>
        </form>
      </section>

      <section>
        <h2 className="mb-3 font-semibold">{t('activeTitle')}</h2>
        <div className="flex flex-col gap-2">
          {active.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center gap-3 rounded-lg border p-3 text-sm">
              <span className="font-medium">{nm(p.name as Record<string, string>)}</span>
              <span className="text-xs opacity-60">{p.type} · {p.halalStatus}</span>
              <span className="text-xs opacity-70">
                {t('until', { date: p.featuredUntil ? dateFmt.format(p.featuredUntil) : '—' })}
              </span>
              {p.featuredNote && <span className="text-xs opacity-60">· {p.featuredNote}</span>}
              <form action={clearFeaturedAction} className="ms-auto">
                <input type="hidden" name="placeId" value={p.id} />
                <button className="rounded border px-3 py-1 text-xs hover:bg-foreground/5">{t('clear')}</button>
              </form>
            </div>
          ))}
          {active.length === 0 && <p className="text-sm opacity-60">{t('empty')}</p>}
        </div>
      </section>
    </main>
  );
}
