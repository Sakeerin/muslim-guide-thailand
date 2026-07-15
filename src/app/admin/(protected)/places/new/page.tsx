import Link from 'next/link';
import { getFormOptions } from '@/server/services/admin-places';
import { PlaceForm } from '@/components/admin/place-form';

export const dynamic = 'force-dynamic';

export default async function NewPlacePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const options = await getFormOptions();

  return (
    <main className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Link href="/admin/places" className="text-sm underline">
          ← สถานที่
        </Link>
        <h1 className="text-2xl font-bold">เพิ่มสถานที่</h1>
      </div>
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{decodeURIComponent(error)}</p>}
      <PlaceForm place={null} options={options} />
    </main>
  );
}
