import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { alternatesFor } from '@/lib/seo';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'footer' });
  return { title: t('privacy'), alternates: alternatesFor('/legal/privacy') };
}

/**
 * PLACEHOLDER. The production privacy policy MUST be drafted/reviewed by a
 * lawyer and human-translated into all 5 locales before launch (PDPA:
 * religion is sensitive data). This page states the platform's data-
 * minimization stance so the commitment is visible from day one.
 */
export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'footer' });

  const th = locale === 'th';

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 py-10">
      <h1 className="text-3xl font-bold">{t('privacy')}</h1>
      <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
        {th
          ? '(ฉบับร่าง — ต้องให้ที่ปรึกษากฎหมายตรวจและแปลโดยมนุษย์ครบ 5 ภาษาก่อนเปิดตัวจริง)'
          : '(Draft — must be reviewed by legal counsel and human-translated into all 5 languages before launch.)'}
      </p>
      <ul className="flex list-disc flex-col gap-2 ps-6 text-sm opacity-80">
        <li>
          {th
            ? 'เราไม่เก็บข้อมูลศาสนาของผู้ใช้ ไม่ถาม ไม่อนุมาน — ใช้ฟีเจอร์หลักได้โดยไม่ต้องสมัครสมาชิก'
            : 'We do not collect, ask for, or infer your religion. Core features work without any account.'}
        </li>
        <li>
          {th
            ? 'พิกัดตำแหน่งใช้คำนวณในเครื่องของคุณ (เวลาละหมาด/กิบลัต) และส่งขึ้นเซิร์ฟเวอร์เฉพาะตอนค้นหา "ใกล้ฉัน" โดยไม่ผูกกับตัวตน'
            : 'Your location is used on-device (prayer times/qibla). It is sent to the server only for a one-off "near me" search, not tied to any identity.'}
        </li>
        <li>
          {th
            ? 'เราใช้ analytics แบบไม่ใช้คุกกี้ ไม่ติดตามข้ามเว็บไซต์'
            : 'We use cookieless analytics and do not track you across sites.'}
        </li>
      </ul>
    </main>
  );
}
