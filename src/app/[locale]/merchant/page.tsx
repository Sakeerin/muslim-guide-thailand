import { headers } from 'next/headers';
import { getFormatter, getLocale, getTranslations, setRequestLocale } from 'next-intl/server';
import { redirect, Link } from '@/i18n/navigation';
import { auth } from '@/server/auth';
import { listMyPlaces } from '@/server/services/claims';
import { getPlaceForEdit } from '@/server/services/admin-places';
import { resolveI18n } from '@/lib/i18n-content';
import { OwnerEditForm } from '@/components/merchant/owner-edit-form';

export const dynamic = 'force-dynamic';

export default async function MerchantPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ edit?: string; submitted?: string; error?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { edit, submitted, error } = await searchParams;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect({ href: '/login', locale });

  const t = await getTranslations('merchant');
  const currentLocale = await getLocale();
  const format = await getFormatter();
  const myPlaces = await listMyPlaces(session!.user.id);

  // if editing, load the owned place (getPlaceForEdit returns full fields)
  const editing = edit ? await getPlaceForEdit(edit) : null;
  const owns = editing && myPlaces.some((p) => p.id === editing.id);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-bold">{t('portalTitle')}</h1>

      {submitted && <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{t('editSubmitted')}</p>}
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{t('editError')}</p>}

      {myPlaces.length === 0 ? (
        <p className="rounded-xl border p-6 text-center opacity-70">{t('portalEmpty')}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {myPlaces.map((p) => (
            <li key={p.id} className="flex items-center justify-between rounded-xl border p-4">
              <div>
                <Link href={`/place/${p.slug}`} className="font-medium underline">
                  {resolveI18n(p.name as never, currentLocale)}
                </Link>
                <p className="text-xs opacity-60">{p.type} · {p.status} · {p.halalStatus}</p>
                {p.featuredUntil && new Date(p.featuredUntil) > new Date() && (
                  <p className="mt-0.5 text-xs text-amber-700">
                    ★ {t('sponsoredUntil', { date: format.dateTime(new Date(p.featuredUntil), { dateStyle: 'medium' }) })}
                  </p>
                )}
              </div>
              <Link
                href={`/merchant?edit=${p.id}`}
                className="rounded-lg border px-3 py-1.5 text-sm hover:bg-foreground/5"
              >
                {t('editListing')}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {owns && editing && (
        <section className="rounded-xl border p-4">
          <h2 className="font-semibold">
            {t('editListing')}: {resolveI18n(editing.name as never, currentLocale)}
          </h2>
          <p className="mb-3 mt-1 text-sm opacity-70">{t('editIntro')}</p>
          <OwnerEditForm place={editing} />
        </section>
      )}
    </main>
  );
}
