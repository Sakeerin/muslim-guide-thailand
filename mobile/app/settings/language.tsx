import { ScrollView, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LanguagePicker } from '@/components/LanguagePicker';
import { colors, space } from '@/lib/theme';

export default function LanguageScreen() {
  const { t } = useTranslation();
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: `🌐 ${t('common.language')}` }} />
      <LanguagePicker />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.bg },
  content: { padding: space.lg },
});
