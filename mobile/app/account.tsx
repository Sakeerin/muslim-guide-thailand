import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { signOut, useSession } from '@/lib/auth/client';
import { LoadingState } from '@/components/states';
import { colors, radius, space } from '@/lib/theme';

export default function AccountScreen() {
  const { t } = useTranslation();
  const { data: session, isPending } = useSession();

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: t('auth.account') }} />

      {isPending ? (
        <LoadingState />
      ) : session ? (
        <View style={styles.card}>
          <Text style={styles.name}>{session.user.name}</Text>
          <Text style={styles.email}>{session.user.email}</Text>
          <Pressable
            style={styles.signOutBtn}
            onPress={() => {
              void signOut();
            }}
            accessibilityRole="button"
          >
            <Text style={styles.signOutText}>{t('auth.signOut')}</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.muted}>{t('auth.loginToReview')}</Text>
          <Link href="/sign-in" asChild>
            <Pressable style={styles.primaryBtn} accessibilityRole="button">
              <Text style={styles.primaryText}>{t('auth.signIn')}</Text>
            </Pressable>
          </Link>
          <Link href="/sign-up" asChild>
            <Pressable style={styles.ghostBtn} accessibilityRole="button">
              <Text style={styles.ghostText}>{t('auth.signUp')}</Text>
            </Pressable>
          </Link>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: space.lg },
  card: { gap: space.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: space.xl },
  name: { fontSize: 20, fontWeight: '800', color: colors.text },
  email: { fontSize: 14, color: colors.textMuted },
  muted: { color: colors.textMuted, textAlign: 'center' },
  signOutBtn: {
    marginTop: space.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: space.md,
    alignItems: 'center',
  },
  signOutText: { color: colors.danger, fontWeight: '600' },
  primaryBtn: { backgroundColor: colors.brand, borderRadius: radius.md, paddingVertical: space.md, alignItems: 'center' },
  primaryText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
  ghostBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: space.md,
    alignItems: 'center',
  },
  ghostText: { color: colors.text, fontWeight: '600' },
});
