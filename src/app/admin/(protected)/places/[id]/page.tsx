import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getFormOptions, getPlaceForEdit } from '@/server/services/admin-places';
import { listCertificationsForPlace } from '@/server/services/certifications';
import { getAdminLocale } from '@/server/admin-locale';
import { PlaceForm } from '@/components/admin/place-form';
import { submitForReviewAction } from '@/app/admin/(protected)/actions';

export const dynamic = 'force-dynamic';

export default async function EditPlacePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { id } = await params;
  const { error, saved } = await searchParams;
  const locale = await getAdminLocale();
  const t = await getTranslations({ locale, namespace: 'admin.places' });

  const [place, options] = await Promise.all([getPlaceForEdit(id), getFormOptions()]);
  if (!place) notFound();
  const certs = await listCertificationsForPlace(id);

  return (
    <main className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/admin/places" className="text-sm underline">
          ← {t('back')}
        </Link>
        <h1 className="text-2xl font-bold">
          {t('editTitle', { name: (place.name as Record<string, string>).th })}
        </h1>
        <a
          href={`/th/place/${place.slug}`}
          target="_blank"
          rel="noreferrer"
          className="text-sm underline opacity-70"
        >
          {t('viewPublic')} ↗
        </a>
      </div>

      {saved && (
        <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{t('saved')}</p>
      )}
      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{decodeURIComponent(error)}</p>
      )}

      {place.status === 'draft' && (
        <form action={submitForReviewAction} className="rounded-lg border bg-foreground/5 p-3">
          <input type="hidden" name="id" value={place.id} />
          <p className="mb-2 text-sm">{t('submitReviewNote')}</p>
          <button className="rounded-lg border px-4 py-1.5 text-sm hover:bg-foreground/10">
            {t('submitReview')}
          </button>
        </form>
      )}

      <PlaceForm place={place} options={options} />

      <section className="rounded-lg border p-3">
        <h2 className="mb-2 font-semibold">{t('certsTitle')}</h2>
        {certs.length === 0 ? (
          <p className="text-sm opacity-60">
            {t('certsEmpty')}{' '}
            <Link href="/admin/certificates" className="underline">
              {t('certsLink')}
            </Link>
          </p>
        ) : (
          <ul className="flex flex-col gap-1 text-sm">
            {certs.map((c) => (
              <li key={c.id}>
                {c.certifyingBody} {c.certNumber ?? ''} — {c.status}
                {c.expiresAt ? ` (${t('certExpires', { date: String(c.expiresAt) })})` : ''}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
