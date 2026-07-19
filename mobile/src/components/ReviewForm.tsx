import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ApiRequestError } from '@/lib/api/envelope';
import { errorMessageKey } from '@/lib/api/error-message';
import { postReview, recordReviewConsent } from '@/lib/api/reviews';
import { useSession } from '@/lib/auth/client';
import { colors, radius, space } from '@/lib/theme';

type State = 'idle' | 'submitting' | 'published' | 'held';

export function ReviewForm({
  placeId,
  locale,
  onSubmitted,
}: {
  placeId: string;
  locale: string;
  /** called after any successful submission (published OR held) so the caller
   *  can reload the list — a held edit removes a previously-published review. */
  onSubmitted?: () => void;
}) {
  const { t } = useTranslation();
  const { data: session, isPending } = useSession();
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState('');
  const [needsConsent, setNeedsConsent] = useState(false);
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<State>('idle');
  // the i18n key of the current error message, or null. Kept explicit (not
  // derived from `state`) so it always matches its cause and clears on toggle.
  const [errorKey, setErrorKey] = useState<string | null>(null);

  if (isPending) return null;

  if (!session) {
    return (
      <Link href="/sign-in" asChild>
        <Pressable style={styles.signInBtn} accessibilityRole="button">
          <Text style={styles.signInText}>{t('auth.loginToReview')}</Text>
        </Pressable>
      </Link>
    );
  }

  if (state === 'published' || state === 'held') {
    return (
      <Text style={styles.success}>
        {state === 'published' ? t('review.submitted') : t('review.held')}
      </Text>
    );
  }

  async function submit() {
    // consent gate must be satisfied before we send anything
    if (needsConsent && !consent) {
      setErrorKey('auth.consentRequired');
      return;
    }
    setState('submitting');
    setErrorKey(null);
    try {
      if (needsConsent) await recordReviewConsent();
      const res = await postReview({ placeId, rating, body, lang: locale });
      setState(res.status === 'published' ? 'published' : 'held');
      // reload on either outcome: a held edit unpublishes a prior review
      onSubmitted?.();
    } catch (e) {
      setState('idle');
      // first-time reviewers who signed in (not up) may lack consent → gate it
      if (e instanceof ApiRequestError && e.code === 'consent_required') {
        setNeedsConsent(true);
        setErrorKey(null);
        return;
      }
      setErrorKey(errorMessageKey(e));
    }
  }

  return (
    <View style={styles.form}>
      <Text style={styles.guidelines}>{t('review.guidelines')}</Text>

      <View style={styles.stars}>
        <Text style={styles.ratingLabel}>{t('review.rating')}</Text>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable key={n} onPress={() => setRating(n)} accessibilityLabel={`${n}`}>
            <Text style={[styles.star, n <= rating ? styles.starOn : styles.starOff]}>★</Text>
          </Pressable>
        ))}
      </View>

      <TextInput
        value={body}
        onChangeText={setBody}
        maxLength={2000}
        multiline
        placeholder={t('review.reviewPlaceholder')}
        style={styles.input}
      />

      {needsConsent ? (
        <Pressable
          style={styles.consentRow}
          onPress={() => {
            setConsent((c) => !c);
            setErrorKey(null); // clear the "please accept" prompt the moment they comply
          }}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: consent }}
        >
          <Text style={styles.checkbox}>{consent ? '☑' : '☐'}</Text>
          <Text style={styles.consentText}>{t('auth.consent')}</Text>
        </Pressable>
      ) : null}

      {errorKey ? <Text style={styles.error}>{t(errorKey)}</Text> : null}

      <Pressable
        style={[styles.btn, state === 'submitting' && styles.btnDisabled]}
        onPress={submit}
        disabled={state === 'submitting'}
        accessibilityRole="button"
      >
        <Text style={styles.btnText}>{t('review.submit')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: space.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: space.lg,
  },
  guidelines: { fontSize: 12, color: colors.textMuted },
  stars: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  ratingLabel: { fontSize: 14, color: colors.text, marginEnd: space.sm },
  star: { fontSize: 26 },
  starOn: { color: '#f59e0b' },
  starOff: { color: '#d1d5db' },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: space.md,
    fontSize: 14,
    color: colors.text,
    minHeight: 72,
    textAlignVertical: 'top',
  },
  consentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
  checkbox: { fontSize: 18, color: colors.brand },
  consentText: { flex: 1, fontSize: 12, color: colors.text },
  error: { color: colors.danger, fontSize: 13 },
  success: {
    backgroundColor: '#ecfdf5',
    borderRadius: radius.md,
    padding: space.md,
    color: colors.certified,
    fontSize: 14,
  },
  btn: {
    alignSelf: 'flex-start',
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    paddingVertical: space.sm,
    paddingHorizontal: space.xl,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
  signInBtn: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.brand,
    borderRadius: radius.md,
    paddingVertical: space.sm,
    paddingHorizontal: space.lg,
  },
  signInText: { color: colors.brand, fontWeight: '600' },
});
