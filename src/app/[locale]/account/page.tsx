import { headers } from 'next/headers';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { redirect, Link } from '@/i18n/navigation';
import { auth } from '@/server/auth';
import { listReviewsByUser } from '@/server/services/reviews';
import { SignOutButton } from '@/components/sign-out-button';

export const dynamic = 'force-dynamic';

const STATUS_LABEL: Record<string, Record<string, string>> = {
  published: { th: 'เผยแพร่แล้ว', en: 'Published' },
  pending: { th: 'รอตรวจสอบ', en: 'Pending review' },
  hidden: { th: 'ถูกซ่อน', en: 'Hidden' },
  removed: { th: 'ถูกลบ', en: 'Removed' },
};

export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect({ href: '/login', locale });

  const t = await getTranslations('auth');
  const reviews = await listReviewsByUser(session!.user.id);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('account')}</h1>
          <p className="text-sm opacity-70">{session!.user.email}</p>
        </div>
        <SignOutButton />
      </div>

      <section>
        <h2 className="mb-3 font-semibold">{t('myReviews')}</h2>
        {reviews.length === 0 ? (
          <p className="text-sm opacity-60">—</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {reviews.map((r) => (
              <li key={r.id} className="rounded-xl border p-3">
                <div className="flex items-center justify-between text-sm">
                  <Link href={`/place/${r.placeSlug}`} className="font-medium underline">
                    {(r.placeName as Record<string, string>).th ?? (r.placeName as Record<string, string>).en}
                  </Link>
                  <span className="opacity-60">{'★'.repeat(r.rating)}</span>
                </div>
                {r.body && <p className="mt-1 text-sm opacity-80">{r.body}</p>}
                <p className="mt-1 text-xs opacity-50">
                  {(STATUS_LABEL[r.status]?.[locale] ?? STATUS_LABEL[r.status]?.en ?? r.status)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
