import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { DayPrayerTimes } from '@/types/api';
import { formatClock, nextPrayer, PRAYER_ORDER } from '@/lib/prayer/format';
import { colors, radius, space } from '@/lib/theme';

/** One day's five prayers; highlights the next upcoming one when `nowHm` given. */
export function PrayerTimesTable({ day, nowHm }: { day: DayPrayerTimes; nowHm?: string }) {
  const { t } = useTranslation();
  const next = nowHm ? nextPrayer(day, nowHm) : null;

  return (
    <View style={styles.card}>
      {PRAYER_ORDER.map((name) => {
        const active = next?.name === name;
        return (
          <View key={name} style={[styles.row, active && styles.activeRow]}>
            <Text style={[styles.label, active && styles.activeText]}>{t(`prayer.${name}`)}</Text>
            <Text style={[styles.time, active && styles.activeText]}>{formatClock(day[name])}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  activeRow: { backgroundColor: '#ecfdf5' },
  label: { fontSize: 15, color: colors.text },
  time: { fontSize: 15, fontWeight: '600', color: colors.text, fontVariant: ['tabular-nums'] },
  activeText: { color: colors.certified, fontWeight: '700' },
});
