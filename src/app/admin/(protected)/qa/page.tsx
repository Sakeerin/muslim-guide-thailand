import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { listPendingAnswers, listPendingQuestions } from '@/server/services/qa';
import {
  approveAnswerAction,
  approveQuestionAction,
  hideAnswerAction,
  hideQuestionAction,
  removeAnswerAction,
  removeQuestionAction,
} from '@/app/admin/(protected)/actions';
import { getAdminLocale } from '@/server/admin-locale';

export const dynamic = 'force-dynamic';

interface ModLabels {
  approve: string;
  hide: string;
  remove: string;
}

function ModButtons({
  id,
  approve,
  hide,
  remove,
  labels,
}: {
  id: string;
  approve: (fd: FormData) => void;
  hide: (fd: FormData) => void;
  remove: (fd: FormData) => void;
  labels: ModLabels;
}) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <form action={approve}>
        <input type="hidden" name="id" value={id} />
        <button className="rounded-lg border border-emerald-300 px-3 py-1.5 text-sm text-emerald-800 hover:bg-emerald-50">
          {labels.approve}
        </button>
      </form>
      <form action={hide}>
        <input type="hidden" name="id" value={id} />
        <button className="rounded-lg border px-3 py-1.5 text-sm hover:bg-foreground/5">{labels.hide}</button>
      </form>
      <form action={remove}>
        <input type="hidden" name="id" value={id} />
        <button className="rounded-lg border px-3 py-1.5 text-sm text-red-700 hover:bg-red-50">{labels.remove}</button>
      </form>
    </div>
  );
}

export default async function AdminQAPage() {
  const locale = await getAdminLocale();
  const t = await getTranslations({ locale, namespace: 'admin.qa' });
  const [pendingQuestions, pendingAnswers] = await Promise.all([
    listPendingQuestions(),
    listPendingAnswers(),
  ]);
  const dateFmt = new Intl.DateTimeFormat(locale, {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'Asia/Bangkok',
  });
  const labels: ModLabels = { approve: t('approve'), hide: t('hide'), remove: t('remove') };

  return (
    <main className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">
        {t('title', { questions: String(pendingQuestions.length), answers: String(pendingAnswers.length) })}
      </h1>
      <p className="rounded-xl bg-foreground/5 p-3 text-sm">
        {t.rich('note', { strong: (chunks) => <strong>{chunks}</strong> })}
      </p>

      <section>
        <h2 className="mb-3 font-semibold">{t('questionsTitle', { count: String(pendingQuestions.length) })}</h2>
        <div className="flex flex-col gap-3">
          {pendingQuestions.map((q) => (
            <div key={q.id} className={`rounded-xl border p-4 ${q.riskFlag ? 'border-red-300 bg-red-50' : ''}`}>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                {q.riskFlag && (
                  <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
                    {t('riskFlag')}
                  </span>
                )}
                <span className="opacity-70">{q.authorName}</span>
                <Link href={`/th/place/${q.placeSlug}`} target="_blank" className="underline opacity-70">
                  {(q.placeName as Record<string, string>).th ?? (q.placeName as Record<string, string>).en}
                </Link>
                <span className="text-xs opacity-50">{dateFmt.format(q.createdAt)}</span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm">{q.body}</p>
              <ModButtons id={q.id} approve={approveQuestionAction} hide={hideQuestionAction} remove={removeQuestionAction} labels={labels} />
            </div>
          ))}
          {pendingQuestions.length === 0 && (
            <p className="rounded-xl border p-6 text-center opacity-60">{t('questionsEmpty')}</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-semibold">{t('answersTitle', { count: String(pendingAnswers.length) })}</h2>
        <div className="flex flex-col gap-3">
          {pendingAnswers.map((a) => (
            <div key={a.id} className={`rounded-xl border p-4 ${a.riskFlag ? 'border-red-300 bg-red-50' : ''}`}>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                {a.riskFlag && (
                  <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
                    {t('riskFlag')}
                  </span>
                )}
                <span className="opacity-70">{a.authorName}</span>
                <Link href={`/th/place/${a.placeSlug}`} target="_blank" className="underline opacity-70">
                  {a.placeSlug}
                </Link>
                <span className="text-xs opacity-50">{dateFmt.format(a.createdAt)}</span>
              </div>
              <p className="mt-1 text-xs opacity-60">{t('questionPrefix', { body: a.questionBody })}</p>
              <p className="mt-2 whitespace-pre-wrap text-sm">{a.body}</p>
              <ModButtons id={a.id} approve={approveAnswerAction} hide={hideAnswerAction} remove={removeAnswerAction} labels={labels} />
            </div>
          ))}
          {pendingAnswers.length === 0 && (
            <p className="rounded-xl border p-6 text-center opacity-60">{t('answersEmpty')}</p>
          )}
        </div>
      </section>
    </main>
  );
}
