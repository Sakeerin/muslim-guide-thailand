import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { getPlace } from '@/lib/api/places';
import { useAsync } from '@/lib/hooks/useAsync';
import { resolveI18n } from '@/lib/i18n/content';
import { TrustPanel } from '@/components/TrustPanel';
import { SavedButton } from '@/components/SavedButton';
import { PlaceCard } from '@/components/PlaceCard';
import { ErrorState, LoadingState } from '@/components/states';
import { colors, radius, space } from '@/lib/theme';

function ActionButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.actionBtn} onPress={onPress} accessibilityRole="button">
      <Text style={styles.actionText}>{label}</Text>
    </Pressable>
  );
}

export default function PlaceScreen() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { data, loading, error, reload } = useAsync(
    (signal) => getPlace(String(slug), signal),
    [slug],
  );

  if (loading) return <LoadingState />;
  if (error || !data) return <ErrorState onRetry={reload} />;

  const { place, prayerNearby } = data;
  const name = resolveI18n(place.name, locale);
  const address = resolveI18n(place.address, locale);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: name }} />

      <Text style={styles.name}>{name}</Text>
      {address ? <Text style={styles.address}>{address}</Text> : null}

      <SavedButton slug={place.slug} name={name} />
      <TrustPanel place={place} />

      <View style={styles.actions}>
        {place.phone ? (
          <ActionButton label={t('common.call')} onPress={() => Linking.openURL(`tel:${place.phone}`)} />
        ) : null}
        {place.website ? (
          <ActionButton label={t('place.website')} onPress={() => Linking.openURL(place.website!)} />
        ) : null}
        {place.googleMapsUrl ? (
          <ActionButton
            label={t('common.navigate')}
            onPress={() => Linking.openURL(place.googleMapsUrl!)}
          />
        ) : null}
      </View>

      {prayerNearby.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('place.prayerNearby')}</Text>
          {prayerNearby.map((p) => (
            <PlaceCard key={p.id} place={p} locale={locale} />
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.bg },
  content: { padding: space.lg, gap: space.md },
  name: { fontSize: 22, fontWeight: '800', color: colors.text },
  address: { fontSize: 14, color: colors.textMuted },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  actionBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: space.sm,
    paddingHorizontal: space.lg,
  },
  actionText: { color: colors.brand, fontWeight: '600' },
  section: { gap: space.md, marginTop: space.sm },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
});
