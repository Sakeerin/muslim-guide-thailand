import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { dashboardStats } from '@/server/services/moderation';
import { getAdminLocale } from '@/server/admin-locale';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const locale = await getAdminLocale();
  const t = await getTranslations({ locale, namespace: 'admin.dashboard' });
  const stats = await dashboardStats();

  const statusLabels: Record<string, string> = {
    draft: t('status.draft'),
    pending_review: t('status.pending_review'),
    published: t('status.published'),
    published_unverified: t('status.published_unverified'),
    archived: t('status.archived'),
    removed: t('status.removed'),
  };

  return (
    <main className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold">{t('title')}</h1>

      {stats.openTakedowns.length > 0 && (
        <section className="rounded-xl border-2 border-red-300 bg-red-50 p-4">
          <h2 className="font-bold text-red-800">
            {t('takedownWarning', { count: String(stats.openTakedowns.length) })}
          </h2>
          <ul className="mt-2 flex flex-col gap-1 text-sm text-red-900">
            {stats.openTakedowns.slice(0, 5).map((td) => (
              <li key={td.id}>
                {td.contentType}/{td.contentId.slice(0, 8)}{' '}
                {t.rich('hoursLeft', {
                  hours: String(td.hoursLeft),
                  strong: (chunks) => <strong>{chunks}</strong>,
                })}
              </li>
            ))}
          </ul>
          <Link href="/admin/takedowns" className="mt-2 inline-block text-sm font-medium underline">
            {t('takedownLink')}
          </Link>
        </section>
      )}

      <section>
        <h2 className="mb-3 font-semibold">{t('byStatus')}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {stats.placesByStatus.map((row) => (
            <div key={row.status} className="rounded-xl border p-4 text-center">
              <p className="text-2xl font-bold">{row.count}</p>
              <p className="text-xs opacity-70">{statusLabels[row.status] ?? row.status}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Link href="/admin/submissions" className="rounded-xl border p-6 hover:bg-foreground/5">
          <p className="text-3xl font-bold">{stats.pendingSubmissionCount}</p>
          <p className="opacity-70">{t('pendingSubmissions')}</p>
        </Link>
        <Link href="/admin/places" className="rounded-xl border p-6 hover:bg-foreground/5">
          <p className="text-3xl font-bold">→</p>
          <p className="opacity-70">{t('managePlaces')}</p>
        </Link>
      </section>
    </main>
  );
}
