import Link from 'next/link';
import { listPendingReviews } from '@/server/services/reviews';
import {
  approveReviewAction,
  hideReviewAction,
  removeReviewAction,
} from '@/app/admin/(protected)/actions';

export const dynamic = 'force-dynamic';

export default async function AdminReviewsPage() {
  const queue = await listPendingReviews();

  return (
    <main className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">คิวรีวิว ({queue.length})</h1>
      <p className="rounded-xl bg-foreground/5 p-3 text-sm">
        รีวิวที่ถูกตั้งธง <strong>เสี่ยง</strong> (สีแดง) มีคำที่อาจเป็นการกล่าวหาเชิงข้อเท็จจริง
        (เช่น &quot;ไม่ฮาลาล&quot;, หมู, หลอก) — พิจารณาความเสี่ยงหมิ่นประมาทก่อนเผยแพร่;
        ถ้าเป็นข้อกังวลเรื่องฮาลาลจริง ให้จัดการผ่านคิว &quot;รายงาน&quot; (ลับ) ไม่ใช่เผยแพร่รีวิว
      </p>

      <div className="flex flex-col gap-3">
        {queue.map((r) => (
          <div key={r.id} className={`rounded-xl border p-4 ${r.riskFlag ? 'border-red-300 bg-red-50' : ''}`}>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {r.riskFlag && (
                <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">เสี่ยง</span>
              )}
              <span className="text-amber-500">{'★'.repeat(r.rating)}</span>
              <span className="opacity-70">{r.authorName}</span>
              <Link href={`/th/place/${r.placeSlug}`} target="_blank" className="underline opacity-70">
                {(r.placeName as Record<string, string>).th ?? (r.placeName as Record<string, string>).en}
              </Link>
              <span className="text-xs opacity-50">
                {new Intl.DateTimeFormat('th-TH', { dateStyle: 'short', timeStyle: 'short' }).format(r.createdAt)}
              </span>
            </div>
            {r.body && <p className="mt-2 whitespace-pre-wrap text-sm">{r.body}</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              <form action={approveReviewAction}>
                <input type="hidden" name="reviewId" value={r.id} />
                <button className="rounded-lg border border-emerald-300 px-3 py-1.5 text-sm text-emerald-800 hover:bg-emerald-50">
                  อนุมัติเผยแพร่
                </button>
              </form>
              <form action={hideReviewAction}>
                <input type="hidden" name="reviewId" value={r.id} />
                <button className="rounded-lg border px-3 py-1.5 text-sm hover:bg-foreground/5">ซ่อน</button>
              </form>
              <form action={removeReviewAction}>
                <input type="hidden" name="reviewId" value={r.id} />
                <button className="rounded-lg border px-3 py-1.5 text-sm text-red-700 hover:bg-red-50">ลบ</button>
              </form>
            </div>
          </div>
        ))}
        {queue.length === 0 && (
          <p className="rounded-xl border p-6 text-center opacity-60">ไม่มีรีวิวรอตรวจสอบ</p>
        )}
      </div>
    </main>
  );
}
