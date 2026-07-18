import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { PlaceDetail } from '@/types/api';
import { halalLabelKey } from '@/lib/trust/halal';
import { colors, radius, space } from '@/lib/theme';
import { HalalBadge } from './HalalBadge';

function isoDay(iso: string | null | undefined): string {
  return iso ? iso.slice(0, 10) : '—';
}

/** Trust box: badge + evidence (source, verified date, certificate) + the
 *  mandatory "not a religious-authority certification" disclaimer. */
export function TrustPanel({ place }: { place: PlaceDetail }) {
  const { t } = useTranslation();
  const cert = place.certifications[0];

  return (
    <View style={styles.panel}>
      <HalalBadge status={place.halalStatus} />
      <Text style={styles.desc}>{t(`trust.${halalLabelKey(place.halalStatus)}_desc`)}</Text>

      {place.lastVerifiedAt ? (
        <Text style={styles.line}>{t('trust.verifiedOn', { date: isoDay(place.lastVerifiedAt) })}</Text>
      ) : null}
      {cert?.certNumber ? (
        <Text style={styles.line}>{t('trust.certNumber', { number: cert.certNumber })}</Text>
      ) : null}
      {cert?.expiresAt ? (
        <Text style={styles.line}>
          {cert.status === 'expired'
            ? t('trust.certExpired')
            : t('trust.certExpires', { date: isoDay(cert.expiresAt) })}
        </Text>
      ) : null}
      {place.disputed ? <Text style={styles.warn}>{t('trust.underReview')}</Text> : null}

      <Text style={styles.disclaimer}>{t('trust.disclaimer')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: '#f8fafc',
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: space.lg,
    gap: space.sm,
  },
  desc: { color: colors.text, fontSize: 14 },
  line: { color: colors.textMuted, fontSize: 13 },
  warn: { color: colors.friendly, fontSize: 13, fontWeight: '600' },
  disclaimer: { color: colors.textMuted, fontSize: 11, marginTop: space.sm },
});
