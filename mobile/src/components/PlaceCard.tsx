import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { PlaceListItem } from '@/types/api';
import { resolveI18n } from '@/lib/i18n/content';
import { fmtDistance } from '@/lib/format/number';
import { colors, radius, space } from '@/lib/theme';
import { HalalBadge } from './HalalBadge';

export function PlaceCard({ place, locale }: { place: PlaceListItem; locale: string }) {
  const { t } = useTranslation();
  const name = resolveI18n(place.name, locale);
  const dist = typeof place.distanceM === 'number' ? fmtDistance(place.distanceM) : null;

  return (
    <Link href={`/place/${place.slug}`} asChild>
      <Pressable style={styles.card} accessibilityRole="button">
        <View style={styles.headerRow}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          {place.featured ? <Text style={styles.sponsored}>{t('common.sponsored')}</Text> : null}
        </View>

        <HalalBadge status={place.halalStatus} />

        <View style={styles.metaRow}>
          {dist ? (
            <Text style={styles.meta}>
              {dist.value} {dist.unit}
            </Text>
          ) : null}
          {place.openNow === true ? (
            <Text style={[styles.meta, styles.open]}>{t('place.openNow')}</Text>
          ) : null}
          {place.openNow === false ? (
            <Text style={[styles.meta, styles.closed]}>{t('place.closedNow')}</Text>
          ) : null}
          {place.disputed ? (
            <Text style={[styles.meta, styles.disputed]}>{t('trust.underReview')}</Text>
          ) : null}
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: space.lg,
    gap: space.sm,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  name: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.text },
  sponsored: { fontSize: 11, fontWeight: '600', color: colors.sponsored },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, flexWrap: 'wrap' },
  meta: { fontSize: 13, color: colors.textMuted },
  open: { color: colors.certified, fontWeight: '600' },
  closed: { color: colors.danger },
  disputed: { color: colors.friendly },
});
