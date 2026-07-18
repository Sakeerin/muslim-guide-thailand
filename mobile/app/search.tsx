import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { HalalStatus, PlaceListItem, PlaceType } from '@/types/api';
import { getPlaces } from '@/lib/api/places';
import { HALAL_STATUSES } from '@/lib/trust/halal';
import { PlaceCard } from '@/components/PlaceCard';
import { EmptyState, ErrorState } from '@/components/states';
import { colors, radius, space } from '@/lib/theme';

const LIMIT = 20;
const TYPES: PlaceType[] = ['restaurant', 'mosque', 'prayer_room', 'attraction'];

export default function SearchScreen() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const { city } = useLocalSearchParams<{ city?: string }>();

  const [text, setText] = useState('');
  const [q, setQ] = useState<string | undefined>(undefined);
  const [type, setType] = useState<PlaceType | undefined>(undefined);
  const [halal, setHalal] = useState<HalalStatus[]>([]);

  const [items, setItems] = useState<PlaceListItem[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const filterKey = JSON.stringify({ city, q, type, halal });

  useEffect(() => {
    const controller = new AbortController();
    // Intentional: reset to a loading state whenever the filters change.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    getPlaces({ city, q, type, halal, limit: LIMIT, offset: 0 }, controller.signal)
      .then((res) => {
        setItems(res.items);
        setOffset(res.items.length);
        setHasMore(res.items.length === LIMIT);
      })
      .catch((e: unknown) => {
        if (!controller.signal.aborted) setError(e instanceof Error ? e : new Error(String(e)));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  async function loadMore() {
    if (loadingMore || loading || !hasMore) return;
    setLoadingMore(true);
    try {
      const res = await getPlaces({ city, q, type, halal, limit: LIMIT, offset });
      setItems((prev) => [...prev, ...res.items]);
      setOffset((o) => o + res.items.length);
      setHasMore(res.items.length === LIMIT);
    } catch {
      /* keep current list on a failed "load more" */
    } finally {
      setLoadingMore(false);
    }
  }

  function toggleHalal(status: HalalStatus) {
    setHalal((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status],
    );
  }

  const header = (
    <View style={styles.filters}>
      <TextInput
        style={styles.input}
        placeholder={t('common.searchPlaceholder')}
        value={text}
        onChangeText={setText}
        onSubmitEditing={() => setQ(text.trim() || undefined)}
        returnKeyType="search"
        autoCapitalize="none"
      />
      <View style={styles.chipRow}>
        {TYPES.map((ty) => {
          const active = type === ty;
          return (
            <Pressable
              key={ty}
              onPress={() => setType(active ? undefined : ty)}
              style={[styles.chip, active && styles.activeChip]}
            >
              <Text style={[styles.chipText, active && styles.activeText]}>{t(`nav.${ty}`, ty)}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.chipRow}>
        {HALAL_STATUSES.map((h) => {
          const active = halal.includes(h);
          return (
            <Pressable
              key={h}
              onPress={() => toggleHalal(h)}
              style={[styles.chip, active && styles.activeChip]}
            >
              <Text style={[styles.chipText, active && styles.activeText]}>{t(`trust.${h}`)}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ title: t('common.search') }} />
      {error ? (
        <ErrorState onRetry={() => setQ((v) => v)} />
      ) : (
        <FlatList
          style={styles.screen}
          data={loading ? [] : items}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => <PlaceCard place={item} locale={locale} />}
          ListHeaderComponent={header}
          ItemSeparatorComponent={() => <View style={{ height: space.md }} />}
          ListEmptyComponent={
            loading ? (
              <ActivityIndicator color={colors.brand} style={{ marginTop: space.xl }} />
            ) : (
              <EmptyState message={t('saved.empty')} />
            )
          }
          ListFooterComponent={
            loadingMore ? <ActivityIndicator color={colors.brand} style={{ marginVertical: space.lg }} /> : null
          }
          onEndReachedThreshold={0.5}
          onEndReached={loadMore}
          contentContainerStyle={styles.content}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.bg },
  content: { padding: space.lg, gap: space.md },
  filters: { gap: space.sm, marginBottom: space.sm },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    fontSize: 15,
    color: colors.text,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
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
});
