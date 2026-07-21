import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/server/auth';
import {
  acknowledgeSubmission,
  listSubmissionQueue,
  resolveSubmission,
} from '@/server/services/moderation';
import { getAdminLocale } from '@/server/admin-locale';

export const dynamic = 'force-dynamic';

// Submission category → i18n key. Values map 1:1 to the stored enum.
const CATEGORY_KEY: Record<string, string> = {
  new_place: 'catNewPlace',
  place_edit: 'catPlaceEdit',
  place_closed: 'catPlaceClosed',
  wrong_location: 'catWrongLocation',
  halal_concern: 'catHalalConcern',
  inappropriate_media: 'catInappropriateMedia',
  claim: 'catClaim',
  other: 'catOther',
};

async function requireActor() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Unauthorized');
  return session.user.id;
}

async function acknowledgeAction(formData: FormData) {
  'use server';
  const actorId = await requireActor();
  await acknowledgeSubmission(String(formData.get('id')), actorId);
  revalidatePath('/admin/submissions');
}

async function resolveAction(formData: FormData) {
  'use server';
  const actorId = await requireActor();
  await resolveSubmission(
    String(formData.get('id')),
    actorId,
    formData.get('outcome') === 'approved' ? 'approved' : 'rejected',
    String(formData.get('resolution') ?? ''),
  );
  revalidatePath('/admin/submissions');
}

export default async function AdminSubmissionsPage() {
  const locale = await getAdminLocale();
  const t = await getTranslations({ locale, namespace: 'admin.submissions' });
  const queue = await listSubmissionQueue();
  const dateFmt = new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Bangkok',
  });

  return (
    <main className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">{t('title', { count: String(queue.length) })}</h1>
      <p className="text-sm opacity-70">{t('note')}</p>

      <div className="flex flex-col gap-3">
        {queue.map((s) => (
          <div
            key={s.id}
            className={`rounded-xl border p-4 ${s.isConfidential ? 'border-amber-300 bg-amber-50' : ''}`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">
                {CATEGORY_KEY[s.category] ? t(CATEGORY_KEY[s.category]) : s.category}
              </span>
              <span className="text-xs opacity-60">{dateFmt.format(s.createdAt)}</span>
              <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-xs">{s.status}</span>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm">
              {(s.payload as { details?: string }).details ?? JSON.stringify(s.payload)}
            </p>
            {s.reporterContact && (
              <p className="mt-1 text-xs opacity-60">{t('reporterContact', { contact: s.reporterContact })}</p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              {s.status === 'pending' && (
                <form action={acknowledgeAction}>
                  <input type="hidden" name="id" value={s.id} />
                  <button className="rounded-lg border px-3 py-1.5 text-sm hover:bg-foreground/5">
                    {t('acknowledge')}
                  </button>
                </form>
              )}
              <form action={resolveAction} className="flex flex-wrap gap-2">
                <input type="hidden" name="id" value={s.id} />
                <input
                  name="resolution"
                  placeholder={t('resolutionPlaceholder')}
                  className="rounded-lg border bg-background px-3 py-1.5 text-sm"
                />
                <button
                  name="outcome"
                  value="approved"
                  className="rounded-lg border border-emerald-300 px-3 py-1.5 text-sm text-emerald-800 hover:bg-emerald-50"
                >
                  {t('resolveApproved')}
                </button>
                <button
                  name="outcome"
                  value="rejected"
                  className="rounded-lg border px-3 py-1.5 text-sm hover:bg-foreground/5"
                >
                  {t('resolveRejected')}
                </button>
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
