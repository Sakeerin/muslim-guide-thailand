import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link, Stack, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { signUp } from '@/lib/auth/client';
import { recordReviewConsent } from '@/lib/api/reviews';
import { colors, radius, space } from '@/lib/theme';

export default function SignUpScreen() {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!consent) {
      setError(t('auth.consentRequired'));
      return;
    }
    setLoading(true);
    setError(null);
    const { error: err } = await signUp.email({ name: name.trim(), email: email.trim(), password });
    if (err) {
      setLoading(false);
      setError(t('auth.signUpError'));
      return;
    }
    // record PDPA consent now that a session (bearer token) exists — best-effort
    try {
      await recordReviewConsent();
    } catch {
      /* the account is created; consent can be re-granted when posting a review */
    }
    setLoading(false);
    if (router.canGoBack()) router.back();
    else router.replace('/account');
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: t('auth.signUp') }} />

      <Text style={styles.label}>{t('auth.name')}</Text>
      <TextInput value={name} onChangeText={setName} style={styles.input} />

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
        autoComplete="new-password"
        style={styles.input}
      />

      <Pressable
        style={styles.consentRow}
        onPress={() => setConsent((c) => !c)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: consent }}
      >
        <Text style={styles.checkbox}>{consent ? '☑' : '☐'}</Text>
        <Text style={styles.consentText}>{t('auth.consent')}</Text>
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        style={[styles.btn, loading && styles.btnDisabled]}
        onPress={submit}
        disabled={loading}
        accessibilityRole="button"
      >
        <Text style={styles.btnText}>{loading ? '…' : t('auth.signUp')}</Text>
      </Pressable>

      <Link href="/sign-in" style={styles.link}>
        {t('auth.haveAccount')}
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
  consentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm, marginTop: space.md },
  checkbox: { fontSize: 18, color: colors.brand },
  consentText: { flex: 1, fontSize: 13, color: colors.text },
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
