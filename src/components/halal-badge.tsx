import { useTranslations, useFormatter } from 'next-intl';
import { Link } from '@/i18n/navigation';

type HalalStatus = 'cicot_certified' | 'muslim_owned' | 'muslim_friendly' | 'unverified';

const BADGE_STYLES: Record<HalalStatus, string> = {
  cicot_certified: 'bg-emerald-700 text-white',
  muslim_owned: 'bg-emerald-100 text-emerald-900 border border-emerald-300',
  muslim_friendly: 'bg-amber-100 text-amber-900 border border-amber-300',
  unverified: 'bg-gray-100 text-gray-600 border border-gray-300',
};

/** Compact badge for cards/lists. */
export function HalalBadge({ status }: { status: string }) {
  const t = useTranslations('trust');
  const s = (status in BADGE_STYLES ? status : 'unverified') as HalalStatus;
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${BADGE_STYLES[s]}`}>
      {t(s)}
    </span>
  );
}

interface Certification {
  certifyingBody: string;
  certNumber: string | null;
  expiresAt: string | null;
  status: string;
}

/**
 * Full trust box for the place detail page — the heart of the platform.
 * Always shows: badge + WHO verified + WHEN + link to methodology.
 * Never renders the CICOT mark itself; evidence is the certificate details.
 */
export function TrustBox({
  status,
  disputed,
  lastVerifiedAt,
  certifications,
}: {
  status: string;
  disputed: boolean;
  lastVerifiedAt: Date | null;
  certifications: Certification[];
}) {
  const t = useTranslations('trust');
  const format = useFormatter();
  const s = (status in BADGE_STYLES ? status : 'unverified') as HalalStatus;
  const activeCert = certifications.find((c) => c.status === 'verified');
  const expiredCert = certifications.find((c) => c.status === 'expired');

  return (
    <section className="rounded-xl border p-4" aria-label={t(s)}>
      <div className="flex flex-wrap items-center gap-2">
        <HalalBadge status={s} />
        {disputed && (
          <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs text-sky-900">
            {t('underReview')}
          </span>
        )}
      </div>

      <p className="mt-2 text-sm opacity-80">{t(`${s}_desc`)}</p>

      {activeCert?.certNumber && (
        <p className="mt-2 text-sm font-medium">
          {t('certNumber', { number: activeCert.certNumber })}
          {activeCert.expiresAt && (
            <span className="ms-2 opacity-70">
              {t('certExpires', { date: format.dateTime(new Date(activeCert.expiresAt), { dateStyle: 'medium' }) })}
            </span>
          )}
        </p>
      )}
      {!activeCert && expiredCert && (
        <p className="mt-2 text-sm text-amber-700">{t('certExpired')}</p>
      )}

      {lastVerifiedAt && (
        <p className="mt-1 text-xs opacity-60">
          {t('verifiedOn', { date: format.dateTime(lastVerifiedAt, { dateStyle: 'medium' }) })}
        </p>
      )}

      <div className="mt-3 border-t pt-2 text-xs opacity-60">
        <p>{t('disclaimer')}</p>
        <Link href="/how-we-verify" className="mt-1 inline-block underline">
          {t('howWeVerify')}
        </Link>
      </div>
    </section>
  );
}
