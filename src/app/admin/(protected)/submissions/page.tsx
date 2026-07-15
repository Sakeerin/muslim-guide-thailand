import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { auth } from '@/server/auth';
import {
  acknowledgeSubmission,
  listSubmissionQueue,
  resolveSubmission,
} from '@/server/services/moderation';

export const dynamic = 'force-dynamic';

const CATEGORY_LABELS: Record<string, string> = {
  new_place: 'เสนอสถานที่ใหม่',
  place_edit: 'ขอแก้ไขข้อมูล',
  place_closed: 'ร้านปิดกิจการ',
  wrong_location: 'ตำแหน่งผิด',
  halal_concern: '🔒 ข้อกังวลสถานะฮาลาล (ลับ)',
  inappropriate_media: 'รูปไม่เหมาะสม',
  claim: 'ขอ claim ร้าน',
  other: 'อื่นๆ',
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
  const queue = await listSubmissionQueue();

  return (
    <main className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">คิวรายงาน/คำขอ ({queue.length})</h1>
      <p className="text-sm opacity-70">
        รายงานประเภท &quot;ข้อกังวลสถานะฮาลาล&quot; เป็นความลับ — ผลการตรวจสอบสะท้อนออกไปเป็นการ
        เปลี่ยน trust status โดยทีมงานเท่านั้น ห้ามเผยแพร่ข้อกล่าวหา
      </p>

      <div className="flex flex-col gap-3">
        {queue.map((s) => (
          <div
            key={s.id}
            className={`rounded-xl border p-4 ${s.isConfidential ? 'border-amber-300 bg-amber-50' : ''}`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{CATEGORY_LABELS[s.category] ?? s.category}</span>
              <span className="text-xs opacity-60">
                {new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeStyle: 'short' }).format(s.createdAt)}
              </span>
              <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-xs">{s.status}</span>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm">
              {(s.payload as { details?: string }).details ?? JSON.stringify(s.payload)}
            </p>
            {s.reporterContact && (
              <p className="mt-1 text-xs opacity-60">ติดต่อกลับ: {s.reporterContact}</p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              {s.status === 'pending' && (
                <form action={acknowledgeAction}>
                  <input type="hidden" name="id" value={s.id} />
                  <button className="rounded-lg border px-3 py-1.5 text-sm hover:bg-foreground/5">
                    รับเรื่อง
                  </button>
                </form>
              )}
              <form action={resolveAction} className="flex flex-wrap gap-2">
                <input type="hidden" name="id" value={s.id} />
                <input
                  name="resolution"
                  placeholder="บันทึกผลการตรวจสอบ"
                  className="rounded-lg border bg-background px-3 py-1.5 text-sm"
                />
                <button
                  name="outcome"
                  value="approved"
                  className="rounded-lg border border-emerald-300 px-3 py-1.5 text-sm text-emerald-800 hover:bg-emerald-50"
                >
                  ดำเนินการแล้ว
                </button>
                <button
                  name="outcome"
                  value="rejected"
                  className="rounded-lg border px-3 py-1.5 text-sm hover:bg-foreground/5"
                >
                  ไม่พบปัญหา
                </button>
              </form>
            </div>
          </div>
        ))}
        {queue.length === 0 && (
          <p className="rounded-xl border p-6 text-center opacity-60">ไม่มีรายการค้าง</p>
        )}
      </div>
    </main>
  );
}
