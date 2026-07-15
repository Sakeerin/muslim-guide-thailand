import Link from 'next/link';
import { listAllPlacesForAdmin } from '@/server/services/moderation';
import {
  listExpiringCertifications,
  listPendingCertifications,
} from '@/server/services/certifications';
import {
  createCertificationAction,
  verifyCertificationAction,
  rejectCertificationAction,
} from '@/app/admin/(protected)/actions';
import { expiryBucket } from '@/lib/trust';

export const dynamic = 'force-dynamic';

const BUCKET_UI: Record<string, { label: string; cls: string }> = {
  expired: { label: 'หมดอายุแล้ว', cls: 'bg-red-100 text-red-800' },
  lte30: { label: '≤ 30 วัน', cls: 'bg-red-100 text-red-800' },
  lte60: { label: '≤ 60 วัน', cls: 'bg-amber-100 text-amber-900' },
  lte90: { label: '≤ 90 วัน', cls: 'bg-yellow-50 text-yellow-800' },
  later: { label: '> 90 วัน', cls: 'bg-foreground/5' },
};

function bucket(daysLeft: number): { label: string; cls: string } {
  return BUCKET_UI[expiryBucket(daysLeft)];
}

export default async function CertificatesPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; error?: string }>;
}) {
  const { created, error } = await searchParams;
  const [places, pending, expiring] = await Promise.all([
    listAllPlacesForAdmin(),
    listPendingCertifications(),
    listExpiringCertifications(90),
  ]);

  return (
    <main className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">ใบรับรองฮาลาล</h1>
      {created && <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">เพิ่มใบรับรองแล้ว (รอตรวจสอบ)</p>}
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">ข้อมูลไม่ถูกต้อง</p>}

      <section className="rounded-xl border p-4">
        <h2 className="mb-3 font-semibold">เพิ่มใบรับรอง</h2>
        <form action={createCertificationAction} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm">
            สถานที่
            <select name="placeId" required className="rounded border bg-background px-2 py-1">
              <option value="">— เลือก —</option>
              {places.map((p) => (
                <option key={p.id} value={p.id}>
                  {(p.name as Record<string, string>).th ?? (p.name as Record<string, string>).en}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            หน่วยงาน
            <input name="certifyingBody" defaultValue="CICOT" className="rounded border bg-background px-2 py-1" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            เลขที่ใบรับรอง
            <input name="certNumber" className="rounded border bg-background px-2 py-1" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            วันออก
            <input type="date" name="issuedAt" className="rounded border bg-background px-2 py-1" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            วันหมดอายุ
            <input type="date" name="expiresAt" className="rounded border bg-background px-2 py-1" />
          </label>
          <div className="flex items-end">
            <button className="rounded-lg border px-4 py-1.5 text-sm hover:bg-foreground/5">เพิ่ม</button>
          </div>
        </form>
        <p className="mt-2 text-xs opacity-60">
          หลักฐาน (รูปใบรับรอง) เก็บใน private bucket — อัปโหลดไฟล์จะเพิ่มในเฟสถัดไป;
          ตอนนี้บันทึกเลขที่ + วันหมดอายุ + ตรวจไขว้กับ halal.or.th ด้วยมือ
        </p>
      </section>

      <section>
        <h2 className="mb-3 font-semibold">รอตรวจสอบ ({pending.length})</h2>
        <div className="flex flex-col gap-2">
          {pending.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center gap-3 rounded-lg border p-3 text-sm">
              <span className="font-medium">
                {(c.placeName as Record<string, string>).th ?? (c.placeName as Record<string, string>).en}
              </span>
              <span className="opacity-70">
                {c.certifyingBody} {c.certNumber ?? ''} {c.expiresAt ? `· หมดอายุ ${c.expiresAt}` : ''}
              </span>
              <form action={verifyCertificationAction} className="ms-auto">
                <input type="hidden" name="certId" value={c.id} />
                <button className="rounded border border-emerald-300 px-3 py-1 text-emerald-800 hover:bg-emerald-50">
                  ยืนยัน
                </button>
              </form>
              <form action={rejectCertificationAction} className="flex gap-1">
                <input type="hidden" name="certId" value={c.id} />
                <input name="note" placeholder="เหตุผล" className="w-28 rounded border bg-background px-2 py-1" />
                <button className="rounded border px-3 py-1 hover:bg-foreground/5">ปฏิเสธ</button>
              </form>
            </div>
          ))}
          {pending.length === 0 && <p className="text-sm opacity-60">ไม่มีใบรับรองรอตรวจสอบ</p>}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-semibold">ใกล้หมดอายุ ({expiring.length})</h2>
        <p className="mb-2 text-xs opacity-60">
          เมื่อหมดอายุ ระบบจะลดสถานะร้านจาก &quot;รับรอง กอท.&quot; เป็น &quot;Muslim-friendly&quot; อัตโนมัติ
          (cron `cert-expiry`) เพื่อไม่ให้ป้ายอ้างใบรับรองที่หมดอายุ
        </p>
        <div className="flex flex-col gap-2">
          {expiring.map((c) => {
            const b = bucket(c.daysLeft);
            return (
              <div key={c.id} className="flex flex-wrap items-center gap-3 rounded-lg border p-3 text-sm">
                <Link href={`/admin/places/${c.placeId}`} className="font-medium underline">
                  {c.placeName.th ?? c.placeName.en}
                </Link>
                <span className="opacity-70">{c.certNumber ?? ''} · หมดอายุ {c.expiresAt}</span>
                <span className={`ms-auto rounded-full px-2 py-0.5 text-xs ${b.cls}`}>
                  {b.label} ({c.daysLeft} วัน)
                </span>
              </div>
            );
          })}
          {expiring.length === 0 && <p className="text-sm opacity-60">ไม่มีใบรับรองใกล้หมดอายุใน 90 วัน</p>}
        </div>
      </section>
    </main>
  );
}
