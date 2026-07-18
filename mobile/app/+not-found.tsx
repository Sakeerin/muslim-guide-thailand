import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, space } from '@/lib/theme';

export default function NotFoundScreen() {
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: '404' }} />
      <Text style={styles.code}>404</Text>
      <Link href="/" style={styles.link}>
        {t('common.back')}
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md, backgroundColor: colors.bg },
  code: { fontSize: 48, fontWeight: '800', color: colors.textMuted },
  link: { color: colors.brand, fontWeight: '600', fontSize: 16 },
});
