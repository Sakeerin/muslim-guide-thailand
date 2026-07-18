import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { halalLabelKey, halalTone, type HalalTone } from '@/lib/trust/halal';
import { colors, radius, space } from '@/lib/theme';

const TONE_COLOR: Record<HalalTone, string> = {
  certified: colors.certified,
  owned: colors.owned,
  friendly: colors.friendly,
  unverified: colors.unverified,
};

export function HalalBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  return (
    <View style={[styles.badge, { backgroundColor: TONE_COLOR[halalTone(status)] }]}>
      <Text style={styles.text}>{t(`trust.${halalLabelKey(status)}`)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingVertical: space.xs,
    paddingHorizontal: space.md,
  },
  text: { color: '#ffffff', fontSize: 12, fontWeight: '600' },
});
