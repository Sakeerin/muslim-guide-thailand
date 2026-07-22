'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useTransition } from 'react';
import { usePathname, useRouter } from '@/i18n/navigation';
import { locales } from '@/i18n/routing';

// Each locale's endonym — a language is always named in itself, not translated.
const LOCALE_LABEL: Record<string, string> = {
  th: 'ไทย',
  en: 'English',
  ms: 'Melayu',
  id: 'Indonesia',
  ar: 'العربية',
};

/**
 * Public language switcher. Unlike the admin one (cookie + refresh), the public
 * locale lives in the URL path, so this navigates to the same page under the
 * chosen locale via next-intl routing. `key`/`defaultValue` keep it in sync with
 * the URL (incl. browser back/forward); useTransition disables it mid-switch.
 */
export function LanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations('common');
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [pending, startTransition] = useTransition();

  return (
    <select
      key={locale}
      aria-label={t('language')}
      defaultValue={locale}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value;
        startTransition(() => {
          router.replace(
            // @ts-expect-error dynamic params are compatible at runtime
            { pathname, params },
            { locale: next },
          );
        });
      }}
      className="rounded-lg border bg-background px-2 py-1 text-sm disabled:opacity-50"
    >
      {locales.map((l) => (
        <option key={l} value={l}>
          {LOCALE_LABEL[l]}
        </option>
      ))}
    </select>
  );
}
