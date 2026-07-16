import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth, isStaff } from '@/server/auth';

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !isStaff((session.user as { role?: string }).role)) {
    redirect('/admin/login');
  }

  return (
    <>
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-4 px-4 py-3">
          <Link href="/admin" className="font-bold">
            หลังบ้าน
          </Link>
          <nav className="flex flex-wrap gap-4 text-sm">
            <Link href="/admin/places" className="hover:underline">
              สถานที่
            </Link>
            <Link href="/admin/verification" className="hover:underline">
              คิวตรวจสอบ
            </Link>
            <Link href="/admin/certificates" className="hover:underline">
              ใบรับรอง
            </Link>
            <Link href="/admin/reviews" className="hover:underline">
              คิวรีวิว
            </Link>
            <Link href="/admin/submissions" className="hover:underline">
              คิวรายงาน
            </Link>
            <Link href="/admin/takedowns" className="hover:underline">
              Takedown (24 ชม.)
            </Link>
          </nav>
          <span className="ms-auto text-sm opacity-60">
            {session.user.name} ({(session.user as { role?: string }).role})
          </span>
        </div>
      </header>
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</div>
    </>
  );
}
