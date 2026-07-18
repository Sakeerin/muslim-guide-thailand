import { Link } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { getPlaces } from '@/lib/api/places';
import { useAsync } from '@/lib/hooks/useAsync';
import { CITIES } from '@/lib/cities';
import { resolveI18n } from '@/lib/i18n/content';
import { PlaceCard } from '@/components/PlaceCard';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { colors, radius, space } from '@/lib/theme';

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const { data, loading, error, reload } = useAsync((signal) => getPlaces({ limit: 10 }, signal), []);

  const header = (
    <View style={styles.header}>
      <View style={styles.hero}>
        <Text style={styles.title}>{t('common.appName')}</Text>
        <Text style={styles.tagline}>{t('home.heroSubtitle')}</Text>
      </View>

      <View style={styles.actions}>
        <Link href="/search" asChild>
          <Pressable style={styles.primaryBtn} accessibilityRole="button">
            <Text style={styles.primaryText}>🔎 {t('common.search')}</Text>
          </Pressable>
        </Link>
        <Link href="/settings/language" asChild>
          <Pressable style={styles.ghostBtn} accessibilityRole="button">
            <Text style={styles.ghostText}>🌐</Text>
          </Pressable>
        </Link>
      </View>

      <Text style={styles.section}>{t('home.popularCities')}</Text>
      <View style={styles.cities}>
        {CITIES.map((c) => (
          <Link key={c.slug} href={`/search?city=${c.slug}`} asChild>
            <Pressable style={styles.cityChip} accessibilityRole="button">
              <Text style={styles.cityText}>{resolveI18n(c.name, locale)}</Text>
            </Pressable>
          </Link>
        ))}
      </View>

      <Text style={styles.section}>{t('home.browseCategories')}</Text>
      {loading ? <LoadingState /> : null}
      {error ? <ErrorState onRetry={reload} /> : null}
    </View>
  );

  return (
    <FlatList
      style={styles.screen}
      data={loading || error ? [] : (data?.items ?? [])}
      keyExtractor={(p) => p.id}
      renderItem={({ item }) => <PlaceCard place={item} locale={locale} />}
      ListHeaderComponent={header}
      ItemSeparatorComponent={() => <View style={{ height: space.md }} />}
      ListEmptyComponent={!loading && !error ? <EmptyState message={t('saved.empty')} /> : null}
      contentContainerStyle={styles.content}
    />
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.bg },
  content: { padding: space.lg, gap: space.md },
  header: { gap: space.md, marginBottom: space.md },
  hero: { gap: space.xs, paddingVertical: space.md },
  title: { fontSize: 24, fontWeight: '800', color: colors.brand },
  tagline: { fontSize: 15, color: colors.textMuted },
  actions: { flexDirection: 'row', gap: space.sm },
  primaryBtn: {
    flex: 1,
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    paddingVertical: space.md,
    alignItems: 'center',
  },
  primaryText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
  ghostBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostText: { fontSize: 18 },
  section: { fontSize: 17, fontWeight: '700', color: colors.text, marginTop: space.sm },
  cities: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  cityChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
  },
  cityText: { color: colors.text, fontSize: 14 },
});
