import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { getPrayerTimes } from '@/lib/api/prayer';
import { useAsync } from '@/lib/hooks/useAsync';
import { CITIES, DEFAULT_CITY } from '@/lib/cities';
import { resolveI18n } from '@/lib/i18n/content';
import { PrayerTimesTable } from '@/components/PrayerTimesTable';
import { ErrorState, LoadingState } from '@/components/states';
import { colors, radius, space } from '@/lib/theme';

function currentHm(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}`;
}

export default function PrayerScreen() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const [province, setProvince] = useState(DEFAULT_CITY.provinceCode);
  const { data, loading, error, reload } = useAsync(
    (signal) => getPrayerTimes(province, {}, signal),
    [province],
  );
  const today = data?.days[0];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.chips}>
        {CITIES.map((c) => {
          const active = province === c.provinceCode;
          return (
            <Pressable
              key={c.slug}
              onPress={() => setProvince(c.provinceCode)}
              style={[styles.chip, active && styles.activeChip]}
              accessibilityRole="button"
            >
              <Text style={[styles.chipText, active && styles.activeText]}>
                {resolveI18n(c.name, locale)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {loading ? <LoadingState /> : null}
      {error ? <ErrorState onRetry={reload} /> : null}
      {!loading && !error && today ? (
        <>
          <PrayerTimesTable day={today} nowHm={currentHm()} />
          <Text style={styles.source}>
            {data?.source === 'official' ? t('prayer.sourceOfficial') : t('prayer.sourceCalculated')}
          </Text>
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.bg },
  content: { padding: space.lg, gap: space.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
  },
  activeChip: { backgroundColor: colors.brand, borderColor: colors.brand },
  chipText: { color: colors.text, fontSize: 14 },
  activeText: { color: '#ffffff', fontWeight: '600' },
  source: { color: colors.textMuted, fontSize: 12, textAlign: 'center' },
});
