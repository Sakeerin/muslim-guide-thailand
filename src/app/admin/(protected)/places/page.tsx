import Link from 'next/link';
import { listAllPlacesForAdmin } from '@/server/services/moderation';

export const dynamic = 'force-dynamic';

export default async function AdminPlacesPage() {
  const rows = await listAllPlacesForAdmin();

  return (
    <main className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">สถานที่ ({rows.length})</h1>
        <Link href="/admin/places/new" className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-foreground/5">
          + เพิ่มสถานที่
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-start">
              <th className="py-2 pe-3 text-start font-medium">ชื่อ</th>
              <th className="py-2 pe-3 text-start font-medium">ประเภท</th>
              <th className="py-2 pe-3 text-start font-medium">Halal</th>
              <th className="py-2 pe-3 text-start font-medium">สถานะ</th>
              <th className="py-2 pe-3 text-start font-medium">แหล่งข้อมูล</th>
              <th className="py-2 text-start font-medium">ตรวจล่าสุด</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-b last:border-0">
                <td className="py-2 pe-3">
                  <Link href={`/admin/places/${p.id}`} className="font-medium underline">
                    {(p.name as Record<string, string>).th ?? (p.name as Record<string, string>).en}
                  </Link>
                  <span className="ms-2 text-xs opacity-50">{p.slug}</span>
                </td>
                <td className="py-2 pe-3">{p.type}</td>
                <td className="py-2 pe-3">{p.halalStatus}</td>
                <td className="py-2 pe-3">{p.status}</td>
                <td className="py-2 pe-3">{p.dataSource}</td>
                <td className="py-2">
                  {p.lastVerifiedAt
                    ? new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium' }).format(p.lastVerifiedAt)
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
