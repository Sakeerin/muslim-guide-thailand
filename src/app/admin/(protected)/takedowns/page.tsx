import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { auth } from '@/server/auth';
import { hideTakedownContent, listOpenTakedowns } from '@/server/services/moderation';

export const dynamic = 'force-dynamic';

async function hideAction(formData: FormData) {
  'use server';
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Unauthorized');
  await hideTakedownContent(String(formData.get('id')), session.user.id);
  revalidatePath('/admin/takedowns');
}

export default async function AdminTakedownsPage() {
  const queue = await listOpenTakedowns();

  return (
    <main className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">คิว Takedown — SLA 24 ชั่วโมง ({queue.length})</h1>
      <p className="rounded-xl bg-foreground/5 p-3 text-sm">
        ตามประกาศ MDES ต้องดำเนินการภายใน 24 ชม. นับจากรับคำร้อง —
        ถ้ายังตัดสินไม่ได้ให้ &quot;ซ่อนชั่วคราว&quot; ก่อนเสมอ (กู้คืนได้)
        ทุกการกระทำถูกบันทึกใน audit log
      </p>

      <div className="flex flex-col gap-3">
        {queue.map((td) => {
          const hoursLeft = td.hoursLeft;
          const urgent = hoursLeft < 6;
          return (
            <div
              key={td.id}
              className={`rounded-xl border p-4 ${urgent ? 'border-red-400 bg-red-50' : ''}`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">
                  {td.contentType}/{td.contentId.slice(0, 8)}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-bold ${urgent ? 'bg-red-600 text-white' : 'bg-amber-100 text-amber-900'}`}
                >
                  เหลือ {hoursLeft.toFixed(1)} ชม.
                </span>
                <span className="text-xs opacity-60">
                  รับเรื่อง{' '}
                  {new Intl.DateTimeFormat('th-TH', { dateStyle: 'short', timeStyle: 'short' }).format(td.receivedAt)}
                </span>
              </div>
              <p className="mt-2 text-sm">{td.reason}</p>
              {td.legalReference && (
                <p className="mt-1 text-xs opacity-70">ข้ออ้างทางกฎหมาย: {td.legalReference}</p>
              )}
              <p className="mt-1 text-xs opacity-60">
                ผู้ร้อง: {td.requesterName ?? '—'} ({td.requesterContact})
              </p>
              <form action={hideAction} className="mt-3">
                <input type="hidden" name="id" value={td.id} />
                <button className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50">
                  ซ่อนเนื้อหาทันที (กู้คืนได้)
                </button>
              </form>
            </div>
          );
        })}
        {queue.length === 0 && (
          <p className="rounded-xl border p-6 text-center opacity-60">
            ✅ ไม่มีคำร้องค้าง — SLA compliance 100%
          </p>
        )}
      </div>
    </main>
  );
}
