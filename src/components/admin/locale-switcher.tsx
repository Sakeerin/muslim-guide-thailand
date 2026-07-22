'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

// Each locale's endonym — a language is always named in itself, not translated.
const LOCALE_LABEL: Record<string, string> = {
  th: 'ไทย',
  en: 'English',
  ms: 'Melayu',
  id: 'Indonesia',
  ar: 'العربية',
};

const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * Admin UI language switcher. Writes the `admin_locale` cookie (read
 * server-side by getAdminLocale) and refreshes so the server components
 * re-render in the chosen language. Separate from the public NEXT_LOCALE.
 */
export function AdminLocaleSwitcher({
  current,
  locales,
  label,
}: {
  current: string;
  locales: readonly string[];
  label: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <select
      aria-label={label}
      defaultValue={current}
      disabled={pending}
      onChange={(e) => {
        document.cookie = `admin_locale=${e.target.value}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
        startTransition(() => router.refresh());
      }}
      className="rounded border bg-background px-2 py-1 text-sm disabled:opacity-50"
    >
      {locales.map((code) => (
        <option key={code} value={code}>
          {LOCALE_LABEL[code] ?? code}
        </option>
      ))}
    </select>
  );
}
