import Link from 'next/link';
import { listOwnerSubmissions } from '@/server/services/claims';
import {
  approveClaimAction,
  applyOwnerEditAction,
  rejectOwnerSubmissionAction,
} from '@/app/admin/(protected)/actions';

export const dynamic = 'force-dynamic';

const FIELD_LABEL: Record<string, string> = {
  description: 'คำอธิบาย',
  address: 'ที่อยู่',
  phone: 'โทรศัพท์',
  website: 'เว็บไซต์',
  lineId: 'LINE',
  googleMapsUrl: 'Google Maps',
  openingHours: 'เวลาเปิด',
  priceRange: 'ช่วงราคา',
};

function renderVal(v: unknown): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

export default async function AdminMerchantPage() {
  const queue = await listOwnerSubmissions();
  const claims = queue.filter((q) => q.category === 'claim');
  const edits = queue.filter((q) => q.category === 'place_edit');

  return (
    <main className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">เจ้าของร้าน: claim &amp; แก้ไข ({queue.length})</h1>

      <section>
        <h2 className="mb-3 font-semibold">คำขอเป็นเจ้าของ (claim) — {claims.length}</h2>
        <p className="mb-2 text-xs opacity-60">
          ตรวจว่าผู้ขอเป็นตัวแทนร้านจริง (โทร/อีเมลยืนยัน) ก่อนอนุมัติ — อนุมัติแล้วผู้ขอจะจัดการข้อมูลร้านได้ (ผ่าน moderation)
        </p>
        <div className="flex flex-col gap-3">
          {claims.map((c) => {
            const p = c.payload as { contact?: string; message?: string };
            return (
              <div key={c.id} className="rounded-xl border p-4 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/th/place/${c.placeSlug}`} target="_blank" className="font-medium underline">
                    {(c.placeName as Record<string, string>)?.th ?? (c.placeName as Record<string, string>)?.en ?? c.placeSlug}
                  </Link>
                  <span className="opacity-60">ผู้ขอ: {c.submitterName} ({c.submitterEmail})</span>
                </div>
                <p className="mt-1">ติดต่อ: {p.contact}</p>
                {p.message && <p className="mt-1 opacity-80">{p.message}</p>}
                <div className="mt-3 flex gap-2">
                  <form action={approveClaimAction}>
                    <input type="hidden" name="submissionId" value={c.id} />
                    <button className="rounded-lg border border-emerald-300 px-3 py-1.5 text-emerald-800 hover:bg-emerald-50">
                      อนุมัติ (ให้เป็นเจ้าของ)
                    </button>
                  </form>
                  <form action={rejectOwnerSubmissionAction}>
                    <input type="hidden" name="submissionId" value={c.id} />
                    <button className="rounded-lg border px-3 py-1.5 hover:bg-foreground/5">ปฏิเสธ</button>
                  </form>
                </div>
              </div>
            );
          })}
          {claims.length === 0 && <p className="text-sm opacity-60">ไม่มีคำขอ</p>}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-semibold">การแก้ไขจากเจ้าของ (รอตรวจ) — {edits.length}</h2>
        <div className="flex flex-col gap-3">
          {edits.map((e) => {
            const payload = e.payload as Record<string, unknown>;
            return (
              <div key={e.id} className="rounded-xl border p-4 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/th/place/${e.placeSlug}`} target="_blank" className="font-medium underline">
                    {(e.placeName as Record<string, string>)?.th ?? (e.placeName as Record<string, string>)?.en ?? e.placeSlug}
                  </Link>
                  <span className="opacity-60">โดย: {e.submitterName}</span>
                </div>
                <ul className="mt-2 flex flex-col gap-1">
                  {Object.entries(payload).map(([k, v]) => (
                    <li key={k}>
                      <span className="font-medium">{FIELD_LABEL[k] ?? k}:</span>{' '}
                      <span className="opacity-80">{renderVal(v)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex gap-2">
                  <form action={applyOwnerEditAction}>
                    <input type="hidden" name="submissionId" value={e.id} />
                    <button className="rounded-lg border border-emerald-300 px-3 py-1.5 text-emerald-800 hover:bg-emerald-50">
                      อนุมัติ + ใช้การแก้ไข
                    </button>
                  </form>
                  <form action={rejectOwnerSubmissionAction}>
                    <input type="hidden" name="submissionId" value={e.id} />
                    <button className="rounded-lg border px-3 py-1.5 hover:bg-foreground/5">ปฏิเสธ</button>
                  </form>
                </div>
              </div>
            );
          })}
          {edits.length === 0 && <p className="text-sm opacity-60">ไม่มีการแก้ไขรอตรวจ</p>}
        </div>
      </section>
    </main>
  );
}
