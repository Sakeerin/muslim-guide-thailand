'use client';

import { useLocale } from 'next-intl';
import { useParams } from 'next/navigation';
import { usePathname, useRouter } from '@/i18n/navigation';
import { locales } from '@/i18n/routing';

const LABELS: Record<string, string> = {
  th: 'ไทย',
  en: 'English',
  ms: 'Melayu',
  id: 'Indonesia',
  ar: 'العربية',
};

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  return (
    <select
      className="rounded-lg border bg-background px-2 py-1 text-sm"
      value={locale}
      aria-label="Language"
      onChange={(e) => {
        router.replace(
          // @ts-expect-error dynamic params are compatible at runtime
          { pathname, params },
          { locale: e.target.value },
        );
      }}
    >
      {locales.map((l) => (
        <option key={l} value={l}>
          {LABELS[l]}
        </option>
      ))}
    </select>
  );
}
