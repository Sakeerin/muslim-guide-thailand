import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LOCALES, type Locale } from '@/lib/i18n/locale';
import { changeLocale } from '@/lib/i18n';
import { colors, radius, space } from '@/lib/theme';

const LABELS: Record<Locale, string> = {
  en: 'English',
  th: 'ไทย',
  ms: 'Bahasa Melayu',
  id: 'Bahasa Indonesia',
  ar: 'العربية',
};

export function LanguagePicker() {
  const { i18n, t } = useTranslation();
  const current = i18n.language;

  async function onPick(loc: Locale) {
    const { needsReload } = await changeLocale(loc);
    if (needsReload) {
      // RTL/LTR flips only take effect after a full restart in React Native.
      Alert.alert(t('common.appName'), t('common.rtlRestart'));
    }
  }

  return (
    <View style={styles.list}>
      {LOCALES.map((loc) => (
        <Pressable
          key={loc}
          style={[styles.row, current === loc && styles.activeRow]}
          onPress={() => onPick(loc)}
          accessibilityRole="button"
        >
          <Text style={styles.label}>{LABELS[loc]}</Text>
          {current === loc ? <Text style={styles.check}>✓</Text> : null}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  activeRow: { backgroundColor: '#ecfdf5' },
  label: { fontSize: 16, color: colors.text },
  check: { fontSize: 16, color: colors.brand, fontWeight: '700' },
});
