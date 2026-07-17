import { listActiveFeatured, listFeaturablePlaces } from '@/server/services/featured';
import { setFeaturedAction, clearFeaturedAction } from '@/app/admin/(protected)/actions';

export const dynamic = 'force-dynamic';

function nm(name: Record<string, string>): string {
  return name.th ?? name.en ?? Object.values(name)[0] ?? '—';
}

export default async function AdminFeaturedPage() {
  const [active, places] = await Promise.all([listActiveFeatured(), listFeaturablePlaces()]);

  return (
    <main className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Sponsored / Featured ({active.length})</h1>
      <p className="rounded-xl bg-foreground/5 p-3 text-sm">
        การจัดวางแบบสนับสนุน (B2B) — ตั้งโดยทีมงาน, การเรียกเก็บเงินทำนอกระบบ (แอปไม่รับชำระเงิน).
        รายการ featured จะขึ้นก่อนในหน้าเมือง/ค้นหา พร้อมป้าย &quot;ได้รับการสนับสนุน&quot; เสมอ และ
        <strong> ไม่กระทบสถานะฮาลาล</strong> — การสนับสนุนไม่ใช่การรับรอง. หมดอายุอัตโนมัติเมื่อถึงกำหนด.
      </p>

      <section className="rounded-xl border p-4">
        <h2 className="mb-3 font-semibold">เพิ่ม/ต่ออายุการสนับสนุน</h2>
        <form action={setFeaturedAction} className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-sm">
            สถานที่
            <select name="placeId" required className="rounded border bg-background px-2 py-1">
              <option value="">— เลือก —</option>
              {places.map((p) => (
                <option key={p.id} value={p.id}>
                  {nm(p.name as Record<string, string>)} ({p.type})
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            ระยะเวลา (วัน)
            <input name="days" type="number" min="1" max="365" defaultValue="30" className="w-24 rounded border bg-background px-2 py-1" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            หมายเหตุ (แพ็กเกจ/ผู้ติดต่อ)
            <input name="note" className="rounded border bg-background px-2 py-1" />
          </label>
          <button className="rounded-lg border px-4 py-1.5 text-sm hover:bg-foreground/5">ตั้งเป็น Featured</button>
        </form>
      </section>

      <section>
        <h2 className="mb-3 font-semibold">กำลังสนับสนุนอยู่</h2>
        <div className="flex flex-col gap-2">
          {active.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center gap-3 rounded-lg border p-3 text-sm">
              <span className="font-medium">{nm(p.name as Record<string, string>)}</span>
              <span className="text-xs opacity-60">{p.type} · {p.halalStatus}</span>
              <span className="text-xs opacity-70">
                ถึง {p.featuredUntil ? new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeStyle: 'short' }).format(p.featuredUntil) : '—'}
              </span>
              {p.featuredNote && <span className="text-xs opacity-60">· {p.featuredNote}</span>}
              <form action={clearFeaturedAction} className="ms-auto">
                <input type="hidden" name="placeId" value={p.id} />
                <button className="rounded border px-3 py-1 text-xs hover:bg-foreground/5">ยกเลิก</button>
              </form>
            </div>
          ))}
          {active.length === 0 && <p className="text-sm opacity-60">ยังไม่มีรายการที่สนับสนุน</p>}
        </div>
      </section>
    </main>
  );
}
