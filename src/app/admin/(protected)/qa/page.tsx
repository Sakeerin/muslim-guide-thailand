import Link from 'next/link';
import { listPendingAnswers, listPendingQuestions } from '@/server/services/qa';
import {
  approveAnswerAction,
  approveQuestionAction,
  hideAnswerAction,
  hideQuestionAction,
  removeAnswerAction,
  removeQuestionAction,
} from '@/app/admin/(protected)/actions';

export const dynamic = 'force-dynamic';

const fmt = (d: Date) =>
  new Intl.DateTimeFormat('th-TH', { dateStyle: 'short', timeStyle: 'short' }).format(d);

function ModButtons({
  id,
  approve,
  hide,
  remove,
}: {
  id: string;
  approve: (fd: FormData) => void;
  hide: (fd: FormData) => void;
  remove: (fd: FormData) => void;
}) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <form action={approve}>
        <input type="hidden" name="id" value={id} />
        <button className="rounded-lg border border-emerald-300 px-3 py-1.5 text-sm text-emerald-800 hover:bg-emerald-50">
          อนุมัติเผยแพร่
        </button>
      </form>
      <form action={hide}>
        <input type="hidden" name="id" value={id} />
        <button className="rounded-lg border px-3 py-1.5 text-sm hover:bg-foreground/5">ซ่อน</button>
      </form>
      <form action={remove}>
        <input type="hidden" name="id" value={id} />
        <button className="rounded-lg border px-3 py-1.5 text-sm text-red-700 hover:bg-red-50">ลบ</button>
      </form>
    </div>
  );
}

export default async function AdminQAPage() {
  const [pendingQuestions, pendingAnswers] = await Promise.all([
    listPendingQuestions(),
    listPendingAnswers(),
  ]);

  return (
    <main className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">
        คิวถาม-ตอบ (คำถาม {pendingQuestions.length} · คำตอบ {pendingAnswers.length})
      </h1>
      <p className="rounded-xl bg-foreground/5 p-3 text-sm">
        คำถาม/คำตอบที่ถูกตั้งธง <strong>เสี่ยง</strong> (สีแดง) มีคำที่อาจเป็นการกล่าวหาเชิงข้อเท็จจริง —
        พิจารณาความเสี่ยงหมิ่นประมาทก่อนเผยแพร่; ข้อกังวลเรื่องฮาลาลให้จัดการผ่านคิว &quot;รายงาน&quot; (ลับ)
      </p>

      <section>
        <h2 className="mb-3 font-semibold">คำถาม ({pendingQuestions.length})</h2>
        <div className="flex flex-col gap-3">
          {pendingQuestions.map((q) => (
            <div key={q.id} className={`rounded-xl border p-4 ${q.riskFlag ? 'border-red-300 bg-red-50' : ''}`}>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                {q.riskFlag && (
                  <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">เสี่ยง</span>
                )}
                <span className="opacity-70">{q.authorName}</span>
                <Link href={`/th/place/${q.placeSlug}`} target="_blank" className="underline opacity-70">
                  {(q.placeName as Record<string, string>).th ?? (q.placeName as Record<string, string>).en}
                </Link>
                <span className="text-xs opacity-50">{fmt(q.createdAt)}</span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm">{q.body}</p>
              <ModButtons id={q.id} approve={approveQuestionAction} hide={hideQuestionAction} remove={removeQuestionAction} />
            </div>
          ))}
          {pendingQuestions.length === 0 && (
            <p className="rounded-xl border p-6 text-center opacity-60">ไม่มีคำถามรอตรวจสอบ</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-semibold">คำตอบ ({pendingAnswers.length})</h2>
        <div className="flex flex-col gap-3">
          {pendingAnswers.map((a) => (
            <div key={a.id} className={`rounded-xl border p-4 ${a.riskFlag ? 'border-red-300 bg-red-50' : ''}`}>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                {a.riskFlag && (
                  <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">เสี่ยง</span>
                )}
                <span className="opacity-70">{a.authorName}</span>
                <Link href={`/th/place/${a.placeSlug}`} target="_blank" className="underline opacity-70">
                  {a.placeSlug}
                </Link>
                <span className="text-xs opacity-50">{fmt(a.createdAt)}</span>
              </div>
              <p className="mt-1 text-xs opacity-60">ถาม: {a.questionBody}</p>
              <p className="mt-2 whitespace-pre-wrap text-sm">{a.body}</p>
              <ModButtons id={a.id} approve={approveAnswerAction} hide={hideAnswerAction} remove={removeAnswerAction} />
            </div>
          ))}
          {pendingAnswers.length === 0 && (
            <p className="rounded-xl border p-6 text-center opacity-60">ไม่มีคำตอบรอตรวจสอบ</p>
          )}
        </div>
      </section>
    </main>
  );
}
