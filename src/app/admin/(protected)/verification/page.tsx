import Link from 'next/link';
import { listVerificationQueue } from '@/server/services/verification';
import { verifyPlaceAction, rejectPlaceAction } from '@/app/admin/(protected)/actions';

export const dynamic = 'force-dynamic';

const HALAL_STATUSES = [
  { value: 'cicot_certified', label: 'L1 รับรอง กอท.', fourEyes: true },
  { value: 'muslim_owned', label: 'L2 เจ้าของมุสลิม', fourEyes: true },
  { value: 'muslim_friendly', label: 'L3 Muslim-friendly', fourEyes: false },
  { value: 'unverified', label: 'L4 ยังไม่ตรวจสอบ', fourEyes: false },
];

const METHODS = [
  { value: 'site_visit', label: 'ตรวจภาคสนาม' },
  { value: 'phone', label: 'โทรสอบ' },
  { value: 'document', label: 'เอกสาร/ใบรับรอง' },
  { value: 'official_registry', label: 'ทะเบียนราชการ' },
  { value: 'owner_attestation', label: 'คำยืนยันเจ้าของ' },
];

export default async function VerificationQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; verified?: string }>;
}) {
  const { error, verified } = await searchParams;
  const queue = await listVerificationQueue();

  return (
    <main className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">คิวตรวจสอบเพื่อเผยแพร่ ({queue.length})</h1>
      <p className="text-sm opacity-70">
        กติกา 4-eyes: สถานะ L1 (รับรอง กอท.) และ L2 (เจ้าของมุสลิม) ต้องอนุมัติโดยผู้ที่
        ไม่ใช่ผู้สร้างรายการ — ระบบจะปฏิเสธหากผู้อนุมัติเป็นผู้สร้างเอง
      </p>

      {verified && <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">อนุมัติและเผยแพร่แล้ว</p>}
      {error === 'four_eyes' && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          คุณเป็นผู้สร้างรายการนี้ — ต้องให้ผู้อื่นอนุมัติสถานะ L1/L2 (4-eyes)
        </p>
      )}

      <div className="flex flex-col gap-4">
        {queue.map((p) => (
          <div key={p.id} className="rounded-xl border p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Link href={`/admin/places/${p.id}`} className="font-medium underline">
                {(p.name as Record<string, string>).th ?? (p.name as Record<string, string>).en}
              </Link>
              <span className="text-xs opacity-50">{p.type} · {p.slug}</span>
            </div>

            <form action={verifyPlaceAction} className="mt-3 flex flex-wrap items-end gap-2">
              <input type="hidden" name="placeId" value={p.id} />
              <label className="flex flex-col gap-1 text-sm">
                สถานะฮาลาล
                <select name="halalStatus" defaultValue={p.halalStatus} className="rounded border bg-background px-2 py-1">
                  {HALAL_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm">
                วิธีตรวจสอบ
                <select name="verificationMethod" defaultValue="site_visit" className="rounded border bg-background px-2 py-1">
                  {METHODS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </label>
              <button className="rounded-lg border border-emerald-300 px-4 py-1.5 text-sm text-emerald-800 hover:bg-emerald-50">
                อนุมัติ + เผยแพร่
              </button>
            </form>

            <form action={rejectPlaceAction} className="mt-2 flex flex-wrap items-end gap-2">
              <input type="hidden" name="placeId" value={p.id} />
              <input name="note" placeholder="เหตุผลที่ตีกลับ" className="rounded border bg-background px-2 py-1 text-sm" />
              <button className="rounded-lg border px-4 py-1.5 text-sm hover:bg-foreground/5">
                ตีกลับเป็นฉบับร่าง
              </button>
            </form>
          </div>
        ))}
        {queue.length === 0 && (
          <p className="rounded-xl border p-6 text-center opacity-60">ไม่มีรายการรอตรวจสอบ</p>
        )}
      </div>
    </main>
  );
}
