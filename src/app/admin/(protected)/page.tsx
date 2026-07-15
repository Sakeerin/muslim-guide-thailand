import Link from 'next/link';
import { dashboardStats } from '@/server/services/moderation';

export const dynamic = 'force-dynamic';

const STATUS_LABELS: Record<string, string> = {
  draft: 'ฉบับร่าง',
  pending_review: 'รอตรวจสอบ',
  published: 'เผยแพร่แล้ว',
  published_unverified: 'เผยแพร่ (ยังไม่ยืนยัน)',
  archived: 'เก็บถาวร',
  removed: 'ถูกซ่อน/ลบ',
};

export default async function AdminDashboardPage() {
  const stats = await dashboardStats();

  return (
    <main className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold">ภาพรวม</h1>

      {stats.openTakedowns.length > 0 && (
        <section className="rounded-xl border-2 border-red-300 bg-red-50 p-4">
          <h2 className="font-bold text-red-800">
            ⚠️ คำร้อง Takedown ค้าง {stats.openTakedowns.length} เรื่อง (SLA 24 ชม.)
          </h2>
          <ul className="mt-2 flex flex-col gap-1 text-sm text-red-900">
            {stats.openTakedowns.slice(0, 5).map((td) => (
              <li key={td.id}>
                {td.contentType}/{td.contentId.slice(0, 8)} — เหลือ{' '}
                <strong>{td.hoursLeft} ชม.</strong>
              </li>
            ))}
          </ul>
          <Link href="/admin/takedowns" className="mt-2 inline-block text-sm font-medium underline">
            ไปที่คิว Takedown →
          </Link>
        </section>
      )}

      <section>
        <h2 className="mb-3 font-semibold">สถานที่ตามสถานะ</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {stats.placesByStatus.map((row) => (
            <div key={row.status} className="rounded-xl border p-4 text-center">
              <p className="text-2xl font-bold">{row.count}</p>
              <p className="text-xs opacity-70">{STATUS_LABELS[row.status] ?? row.status}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Link href="/admin/submissions" className="rounded-xl border p-6 hover:bg-foreground/5">
          <p className="text-3xl font-bold">{stats.pendingSubmissionCount}</p>
          <p className="opacity-70">รายงาน/คำขอที่รอดำเนินการ</p>
        </Link>
        <Link href="/admin/places" className="rounded-xl border p-6 hover:bg-foreground/5">
          <p className="text-3xl font-bold">→</p>
          <p className="opacity-70">จัดการสถานที่ทั้งหมด</p>
        </Link>
      </section>
    </main>
  );
}
