import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link, Stack, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { signIn } from '@/lib/auth/client';
import { colors, radius, space } from '@/lib/theme';

export default function SignInScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setError(null);
    const { error: err } = await signIn.email({ email: email.trim(), password });
    setLoading(false);
    if (err) {
      setError(t('auth.invalidCredentials'));
      return;
    }
    if (router.canGoBack()) router.back();
    else router.replace('/account');
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: t('auth.signIn') }} />

      <Text style={styles.label}>{t('auth.email')}</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        style={styles.input}
      />

      <Text style={styles.label}>{t('auth.password')}</Text>
      <TextInput
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="current-password"
        style={styles.input}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        style={[styles.btn, loading && styles.btnDisabled]}
        onPress={submit}
        disabled={loading}
        accessibilityRole="button"
      >
        <Text style={styles.btnText}>{loading ? '…' : t('auth.signIn')}</Text>
      </Pressable>

      <Link href="/sign-up" style={styles.link}>
        {t('auth.noAccount')}
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: space.lg, gap: space.sm },
  label: { fontSize: 13, color: colors.textMuted, marginTop: space.sm },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    fontSize: 15,
    color: colors.text,
  },
  error: { color: colors.danger, fontSize: 13 },
  btn: {
    marginTop: space.md,
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    paddingVertical: space.md,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
  link: { color: colors.brand, marginTop: space.lg, textAlign: 'center' },
});
