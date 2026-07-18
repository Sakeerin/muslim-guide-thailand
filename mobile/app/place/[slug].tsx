import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { getPlace } from '@/lib/api/places';
import { getPlaceReviews } from '@/lib/api/reviews';
import { useAsync } from '@/lib/hooks/useAsync';
import { resolveI18n } from '@/lib/i18n/content';
import { TrustPanel } from '@/components/TrustPanel';
import { SavedButton } from '@/components/SavedButton';
import { PlaceCard } from '@/components/PlaceCard';
import { ReviewForm } from '@/components/ReviewForm';
import { ClaimButton } from '@/components/ClaimButton';
import { ErrorState, LoadingState } from '@/components/states';
import { colors, radius, space } from '@/lib/theme';

function ActionButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.actionBtn} onPress={onPress} accessibilityRole="button">
      <Text style={styles.actionText}>{label}</Text>
    </Pressable>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <Text style={styles.starsOn}>
      {'★'.repeat(rating)}
      <Text style={styles.starsOff}>{'★'.repeat(5 - rating)}</Text>
    </Text>
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
  const reviews = useAsync((signal) => getPlaceReviews(String(slug), signal), [slug]);

  if (loading) return <LoadingState />;
  if (error || !data) return <ErrorState onRetry={reload} />;

  const { place, prayerNearby } = data;
  const name = resolveI18n(place.name, locale);
  const address = resolveI18n(place.address, locale);
  const reviewList = reviews.data?.reviews ?? [];

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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('review.title')}</Text>
        <ReviewForm placeId={place.id} locale={locale} onSubmitted={reviews.reload} />

        {reviewList.length > 0 ? (
          <>
            <Text style={styles.disclaimer}>{t('review.disclaimer')}</Text>
            {reviewList.map((r) => (
              <View key={r.id} style={styles.reviewCard}>
                <View style={styles.reviewHead}>
                  <Text style={styles.reviewAuthor}>{r.authorName}</Text>
                  <Stars rating={r.rating} />
                </View>
                {r.body ? <Text style={styles.reviewBody}>{r.body}</Text> : null}
                <Text style={styles.reviewDate}>{r.createdAt.slice(0, 10)}</Text>
              </View>
            ))}
          </>
        ) : reviews.loading ? null : (
          <Text style={styles.muted}>{t('review.empty')}</Text>
        )}
      </View>

      {!place.ownerUserId ? (
        <View style={styles.footer}>
          <ClaimButton slug={place.slug} />
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
  disclaimer: { fontSize: 11, color: colors.textMuted },
  muted: { fontSize: 13, color: colors.textMuted },
  reviewCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: space.md,
    gap: space.xs,
  },
  reviewHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewAuthor: { fontSize: 14, fontWeight: '600', color: colors.text },
  starsOn: { color: '#f59e0b', fontSize: 14 },
  starsOff: { color: '#d1d5db' },
  reviewBody: { fontSize: 14, color: colors.text },
  reviewDate: { fontSize: 11, color: colors.textMuted },
  footer: { marginTop: space.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingTop: space.md },
});
