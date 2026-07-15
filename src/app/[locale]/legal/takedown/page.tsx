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
  return { title: t('takedown'), alternates: alternatesFor('/legal/takedown') };
}

/**
 * Public notice-and-takedown channel (MDES). The form posts to
 * /api/v1/takedowns which starts the 24h SLA clock. Kept intentionally
 * simple and available in every locale.
 */
export default async function TakedownPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'footer' });

  const intro =
    locale === 'th'
      ? 'หากพบเนื้อหาที่ละเมิดสิทธิหรือผิดกฎหมาย โปรดกรอกแบบฟอร์มนี้ ทีมงานจะพิจารณาภายใน 24 ชั่วโมงตามประกาศกระทรวงดิจิทัลฯ (MDES)'
      : 'If you believe content on this site is unlawful or infringes your rights, submit this form. Our team reviews every request within 24 hours per Thai MDES regulations.';

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10">
      <h1 className="text-3xl font-bold">{t('takedown')}</h1>
      <p className="opacity-80">{intro}</p>

      <form method="POST" action="/api/v1/takedowns/form" className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          {locale === 'th' ? 'ประเภทเนื้อหา' : 'Content type'}
          <select name="contentType" className="rounded-lg border bg-background px-3 py-2">
            <option value="place">{locale === 'th' ? 'หน้าสถานที่' : 'Place page'}</option>
            <option value="media">{locale === 'th' ? 'รูปภาพ' : 'Media'}</option>
            <option value="review">{locale === 'th' ? 'รีวิว' : 'Review'}</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {locale === 'th' ? 'รหัส/ลิงก์เนื้อหา (Content ID)' : 'Content ID / URL'}
          <input name="contentId" required className="rounded-lg border bg-background px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {locale === 'th' ? 'ชื่อผู้ร้อง' : 'Your name'}
          <input name="requesterName" className="rounded-lg border bg-background px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {locale === 'th' ? 'ช่องทางติดต่อ (อีเมล/โทร)' : 'Contact (email/phone)'}
          <input name="requesterContact" required className="rounded-lg border bg-background px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {locale === 'th' ? 'เหตุผล/ข้อกฎหมาย' : 'Reason / legal basis'}
          <textarea name="reason" required rows={4} className="rounded-lg border bg-background px-3 py-2" />
        </label>
        {/* honeypot */}
        <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="affirmTruth" value="true" required className="mt-1" />
          <span>
            {locale === 'th'
              ? 'ข้าพเจ้ายืนยันว่าข้อมูลข้างต้นเป็นความจริง'
              : 'I affirm the information above is truthful'}
          </span>
        </label>
        <button className="rounded-lg border px-6 py-2 font-medium hover:bg-foreground/5">
          {locale === 'th' ? 'ส่งคำร้อง' : 'Submit request'}
        </button>
      </form>
    </main>
  );
}
