import { Pressable, StyleSheet, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSavedStore } from '@/lib/saved/store';
import { colors, radius, space } from '@/lib/theme';

export function SavedButton({ slug, name }: { slug: string; name: string }) {
  const { t } = useTranslation();
  const saved = useSavedStore((s) => s.places.some((p) => p.slug === slug));
  const toggle = useSavedStore((s) => s.toggle);

  return (
    <Pressable
      style={[styles.btn, saved && styles.saved]}
      onPress={() => toggle({ slug, name })}
      accessibilityRole="button"
    >
      <Text style={[styles.text, saved && styles.savedText]}>
        {saved ? `★ ${t('common.saved')}` : `☆ ${t('common.save')}`}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderWidth: 1,
    borderColor: colors.brand,
    borderRadius: radius.md,
    paddingVertical: space.sm,
    paddingHorizontal: space.lg,
    alignSelf: 'flex-start',
  },
  saved: { backgroundColor: colors.brand },
  text: { color: colors.brand, fontWeight: '600' },
  savedText: { color: '#ffffff' },
});
