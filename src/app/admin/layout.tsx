import type { Metadata } from 'next';
import '../globals.css';

export const metadata: Metadata = {
  title: 'Admin — Muslim Guide Thailand',
  robots: { index: false, follow: false },
};

/** Admin shell (not localized — staff UI is Thai). Auth guard lives in (protected)/layout. */
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className="h-full antialiased">
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
