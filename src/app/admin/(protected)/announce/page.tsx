import { countDevices, countSubscriptions } from '@/server/services/push';
import { broadcastAnnouncementAction } from '@/app/admin/(protected)/actions';

export const dynamic = 'force-dynamic';

const LOCALES: { code: string; label: string }[] = [
  { code: 'th', label: 'ไทย' },
  { code: 'en', label: 'English' },
  { code: 'ms', label: 'Melayu' },
  { code: 'id', label: 'Indonesia' },
  { code: 'ar', label: 'العربية' },
];

export default async function AdminAnnouncePage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; failed?: string; pruned?: string; total?: string; error?: string }>;
}) {
  const [count, devices, sp] = await Promise.all([
    countSubscriptions(),
    countDevices(),
    searchParams,
  ]);

  return (
    <main className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">
        ประกาศ / Push (เว็บ {count} · แอป {devices})
      </h1>
      <p className="rounded-xl bg-foreground/5 p-3 text-sm">
        ส่งการแจ้งเตือนถึงผู้ที่สมัครรับ (รอมฎอน/อีด) — <strong>ประกาศเท่านั้น</strong>, ไม่ใช่การตลาด.
        ผู้ใช้สมัครแบบไม่ต้องล็อกอิน และถอนได้ทุกเมื่อ. ข้อความจะส่งตามภาษาของแต่ละเครื่อง (เว้นว่างได้ ระบบจะถอยไปใช้ EN/TH).
        การถอนสมัครที่หมดอายุจะถูกลบออกอัตโนมัติ.
      </p>

      {sp.sent !== undefined && (
        <p className="rounded-lg border border-emerald-500/40 bg-emerald-50 p-3 text-sm dark:bg-emerald-950/30">
          ส่งแล้ว: {sp.sent} · ล้มเหลว: {sp.failed} · ลบที่หมดอายุ: {sp.pruned} · ทั้งหมด: {sp.total}
        </p>
      )}
      {sp.error === 'missing' && (
        <p className="rounded-lg border border-red-500/40 bg-red-50 p-3 text-sm dark:bg-red-950/30">
          ต้องระบุหัวข้อและเนื้อหาอย่างน้อยหนึ่งภาษา (แนะนำ ไทย + อังกฤษ)
        </p>
      )}

      <form action={broadcastAnnouncementAction} className="flex flex-col gap-4 rounded-xl border p-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-sm">
            หัวข้อ (topic)
            <select name="topic" className="rounded border bg-background px-2 py-1">
              <option value="">ทั้งหมด</option>
              <option value="ramadan">ramadan</option>
              <option value="eid">eid</option>
              <option value="events">events</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            เปิดหน้า (path)
            <input name="path" defaultValue="/ramadan" className="rounded border bg-background px-2 py-1" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            tag (รวมการแจ้งเตือนซ้ำ)
            <input name="tag" placeholder="ramadan-2026" className="rounded border bg-background px-2 py-1" />
          </label>
        </div>

        <div className="grid gap-3">
          {LOCALES.map((l) => (
            <div key={l.code} className="grid grid-cols-[5rem_1fr_2fr] items-center gap-2" dir={l.code === 'ar' ? 'rtl' : 'ltr'}>
              <span className="text-sm opacity-70">{l.label}</span>
              <input
                name={`title_${l.code}`}
                placeholder="หัวข้อ"
                className="rounded border bg-background px-2 py-1 text-sm"
              />
              <input
                name={`body_${l.code}`}
                placeholder="เนื้อหา"
                className="rounded border bg-background px-2 py-1 text-sm"
              />
            </div>
          ))}
        </div>

        <button className="self-start rounded-lg border px-4 py-1.5 text-sm font-medium hover:bg-foreground/5">
          ส่งประกาศ
        </button>
      </form>
    </main>
  );
}
