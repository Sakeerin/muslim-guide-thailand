import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ApiRequestError } from '@/lib/api/envelope';
import { errorMessageKey } from '@/lib/api/error-message';
import { claimPlace } from '@/lib/api/claims';
import { useSession } from '@/lib/auth/client';
import { colors, radius, space } from '@/lib/theme';

type State = 'idle' | 'open' | 'submitting' | 'sent' | 'claimed';

/**
 * "Own this place? Claim it" — shown only for places with no owner. Sign-in
 * gated; the claim goes to the admin queue (staff grant ownership). The server
 * enforces auth + already-claimed; this is the client affordance.
 */
export function ClaimButton({ slug }: { slug: string }) {
  const { t } = useTranslation();
  const { data: session, isPending } = useSession();
  const [state, setState] = useState<State>('idle');
  const [contact, setContact] = useState('');
  const [message, setMessage] = useState('');
  const [errorKey, setErrorKey] = useState<string | null>(null);

  if (isPending) return null;

  if (!session) {
    return (
      <Link href="/sign-in" asChild>
        <Pressable accessibilityRole="button">
          <Text style={styles.link}>{t('merchant.claimThisPlace')}</Text>
        </Pressable>
      </Link>
    );
  }

  if (state === 'sent') {
    return <Text style={styles.sent}>{t('merchant.claimSent')}</Text>;
  }

  if (state === 'claimed') {
    return <Text style={styles.muted}>{t('merchant.alreadyClaimed')}</Text>;
  }

  if (state === 'idle') {
    return (
      <Pressable onPress={() => setState('open')} accessibilityRole="button">
        <Text style={styles.link}>{t('merchant.claimThisPlace')}</Text>
      </Pressable>
    );
  }

  // state is 'open' or 'submitting'
  async function submit() {
    if (contact.trim().length < 3) {
      setErrorKey('errors.validation');
      return;
    }
    setState('submitting');
    setErrorKey(null);
    try {
      await claimPlace(slug, { contact, message });
      setState('sent');
    } catch (e) {
      if (e instanceof ApiRequestError && e.code === 'already_claimed') {
        setState('claimed');
        return;
      }
      setErrorKey(errorMessageKey(e));
      setState('open');
    }
  }

  return (
    <View style={styles.form}>
      <Text style={styles.title}>{t('merchant.claimTitle')}</Text>
      <Text style={styles.intro}>{t('merchant.claimIntro')}</Text>
      <TextInput
        value={contact}
        onChangeText={setContact}
        placeholder={t('merchant.contact')}
        autoCapitalize="none"
        style={styles.input}
      />
      <TextInput
        value={message}
        onChangeText={setMessage}
        placeholder={t('merchant.message')}
        maxLength={2000}
        multiline
        style={[styles.input, styles.multiline]}
      />
      {errorKey ? <Text style={styles.error}>{t(errorKey)}</Text> : null}
      <Pressable
        style={[styles.btn, state === 'submitting' && styles.btnDisabled]}
        onPress={submit}
        disabled={state === 'submitting'}
        accessibilityRole="button"
      >
        <Text style={styles.btnText}>{t('merchant.submitClaim')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  link: { color: colors.brand, fontWeight: '600' },
  sent: { color: colors.certified, fontSize: 14 },
  muted: { color: colors.textMuted, fontSize: 13 },
  form: {
    gap: space.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: space.lg,
  },
  title: { fontSize: 15, fontWeight: '700', color: colors.text },
  intro: { fontSize: 13, color: colors.textMuted },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: space.md,
    fontSize: 14,
    color: colors.text,
  },
  multiline: { minHeight: 60, textAlignVertical: 'top' },
  error: { color: colors.danger, fontSize: 13 },
  btn: {
    alignSelf: 'flex-start',
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    paddingVertical: space.sm,
    paddingHorizontal: space.xl,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
});
