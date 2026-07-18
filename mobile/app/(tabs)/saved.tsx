import { Link } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSavedStore } from '@/lib/saved/store';
import { EmptyState } from '@/components/states';
import { colors, radius, space } from '@/lib/theme';

export default function SavedScreen() {
  const { t } = useTranslation();
  const places = useSavedStore((s) => s.places);

  if (places.length === 0) {
    return <EmptyState message={t('saved.emptyHint')} />;
  }

  return (
    <FlatList
      style={styles.screen}
      data={places}
      keyExtractor={(p) => p.slug}
      renderItem={({ item }) => (
        <Link href={`/place/${item.slug}`} asChild>
          <Pressable style={styles.row} accessibilityRole="button">
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.chev}>›</Text>
          </Pressable>
        </Link>
      )}
      ItemSeparatorComponent={() => <View style={{ height: space.sm }} />}
      contentContainerStyle={styles.content}
    />
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.bg },
  content: { padding: space.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: space.lg,
  },
  name: { fontSize: 16, fontWeight: '600', color: colors.text, flex: 1 },
  chev: { fontSize: 20, color: colors.textMuted },
});
