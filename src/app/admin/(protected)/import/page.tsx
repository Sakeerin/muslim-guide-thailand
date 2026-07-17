import Link from 'next/link';
import {
  findMatchCandidates,
  listPendingImports,
  pendingCountsBySource,
} from '@/server/services/imports';
import {
  importAsNewAction,
  mergeImportAction,
  rejectImportAction,
} from '@/app/admin/(protected)/actions';

export const dynamic = 'force-dynamic';

function nm(name: Record<string, string>): string {
  return name.th ?? name.en ?? Object.values(name)[0] ?? '—';
}

export default async function AdminImportPage({
  searchParams,
}: {
  searchParams: Promise<{ source?: string }>;
}) {
  const { source } = await searchParams;
  const [counts, records] = await Promise.all([
    pendingCountsBySource(),
    listPendingImports(source, 40),
  ]);

  // match candidates per record (staff tool, small N)
  const withCandidates = await Promise.all(
    records.map(async (r) => ({ record: r, candidates: await findMatchCandidates(r.id) })),
  );

  const totalPending = counts.reduce((s, c) => s + Number(c.count), 0);

  return (
    <main className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">นำเข้าข้อมูล (staging) — รอตรวจ {totalPending}</h1>
      <p className="rounded-xl bg-foreground/5 p-3 text-sm">
        ข้อมูลจากแหล่งเปิดถูกพักไว้ที่นี่ ไม่ขึ้นเว็บจนกว่าทีมงานจะ &quot;นำเข้าเป็นรายการใหม่&quot; หรือ
        &quot;รวมกับที่มีอยู่&quot; (กันข้อมูลซ้ำ) — รายการที่ระบบสงสัยว่าซ้ำจะขึ้นป้าย &quot;น่าจะซ้ำ&quot;
        ทุกการนำเข้าคงการอ้างอิงแหล่งที่มา (ODbL ฯลฯ)
      </p>

      <nav className="flex flex-wrap gap-2 text-sm">
        <Link href="/admin/import" className={`rounded-full border px-3 py-1 ${!source ? 'bg-foreground/10' : ''}`}>
          ทั้งหมด ({totalPending})
        </Link>
        {counts.map((c) => (
          <Link
            key={c.source}
            href={`/admin/import?source=${c.source}`}
            className={`rounded-full border px-3 py-1 ${source === c.source ? 'bg-foreground/10' : ''}`}
          >
            {c.source} ({Number(c.count)})
          </Link>
        ))}
      </nav>

      <div className="flex flex-col gap-3">
        {withCandidates.map(({ record: r, candidates }) => (
          <div key={r.id} className="rounded-xl border p-4">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-medium">{nm(r.name as Record<string, string>)}</span>
              <span className="text-xs opacity-50">{r.source} · {r.placeType} · {r.sourceRef}</span>
              <a
                href={`https://www.google.com/maps?q=${r.lat},${r.lng}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs underline opacity-60"
              >
                {r.lat.toFixed(4)}, {r.lng.toFixed(4)} ↗
              </a>
            </div>
            {r.attribution && <p className="mt-1 text-xs opacity-50">{r.attribution}</p>}

            {candidates.length > 0 && (
              <div className="mt-2 rounded-lg bg-foreground/5 p-2 text-sm">
                <p className="mb-1 text-xs font-medium opacity-70">รายการที่อาจตรงกัน:</p>
                <ul className="flex flex-col gap-1">
                  {candidates.map((c) => (
                    <li key={c.placeId} className="flex flex-wrap items-center gap-2">
                      {c.likelyDuplicate && (
                        <span className="rounded-full bg-amber-200 px-2 text-xs text-amber-900">น่าจะซ้ำ</span>
                      )}
                      <Link href={`/th/place/${c.slug}`} target="_blank" className="underline">
                        {nm(c.name as Record<string, string>)}
                      </Link>
                      <span className="text-xs opacity-60">
                        {c.distanceM} ม. · ชื่อ {Math.round(c.nameSimilarity * 100)}%
                      </span>
                      <form action={mergeImportAction} className="inline">
                        <input type="hidden" name="recordId" value={r.id} />
                        <input type="hidden" name="placeId" value={c.placeId} />
                        <button className="rounded border px-2 py-0.5 text-xs hover:bg-background">
                          รวมกับรายการนี้
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-3 flex gap-2">
              <form action={importAsNewAction}>
                <input type="hidden" name="recordId" value={r.id} />
                <button className="rounded-lg border border-emerald-300 px-3 py-1.5 text-sm text-emerald-800 hover:bg-emerald-50">
                  นำเข้าเป็นรายการใหม่
                </button>
              </form>
              <form action={rejectImportAction}>
                <input type="hidden" name="recordId" value={r.id} />
                <button className="rounded-lg border px-3 py-1.5 text-sm hover:bg-foreground/5">ปฏิเสธ</button>
              </form>
            </div>
          </div>
        ))}
        {records.length === 0 && (
          <p className="rounded-xl border p-6 text-center opacity-60">ไม่มีรายการรอตรวจ</p>
        )}
      </div>
    </main>
  );
}
