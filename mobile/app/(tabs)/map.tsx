import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { getPlacesGeoJson, type GeoJsonPlaceType } from '@/lib/api/geojson';
import { useAsync } from '@/lib/hooks/useAsync';
import { PlacesMap } from '@/components/PlacesMap';
import { ErrorState, LoadingState } from '@/components/states';
import { colors, radius, space } from '@/lib/theme';

const FILTERS: { key: string; value?: GeoJsonPlaceType }[] = [
  { key: 'all' },
  { key: 'restaurant', value: 'restaurant' },
  { key: 'mosque', value: 'mosque' },
  { key: 'prayer_room', value: 'prayer_room' },
];

export default function MapScreen() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const [type, setType] = useState<GeoJsonPlaceType | undefined>(undefined);
  const { data, loading, error, reload } = useAsync(
    (signal) => getPlacesGeoJson({ locale, type }, signal),
    [locale, type],
  );

  return (
    <View style={styles.screen}>
      <View style={styles.filters}>
        {FILTERS.map((f) => {
          const active = type === f.value;
          const label = f.value ? t(`nav.${f.value}`, f.value) : t('common.seeAll');
          return (
            <Pressable
              key={f.key}
              onPress={() => setType(f.value)}
              style={[styles.chip, active && styles.activeChip]}
              accessibilityRole="button"
            >
              <Text style={[styles.chipText, active && styles.activeText]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.mapWrap}>
        {loading ? (
          <LoadingState />
        ) : error || !data ? (
          <ErrorState onRetry={reload} />
        ) : (
          <PlacesMap data={data} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    padding: space.md,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: space.xs,
    paddingHorizontal: space.md,
  },
  activeChip: { backgroundColor: colors.brand, borderColor: colors.brand },
  chipText: { color: colors.text, fontSize: 13 },
  activeText: { color: '#ffffff', fontWeight: '600' },
  mapWrap: { flex: 1 },
});
