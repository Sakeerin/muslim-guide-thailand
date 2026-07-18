import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { QAResult } from '@/types/api';
import { ApiRequestError } from '@/lib/api/envelope';
import { getPlaceQuestions, postAnswer, postQuestion } from '@/lib/api/qa';
import { recordReviewConsent } from '@/lib/api/reviews';
import { useSession } from '@/lib/auth/client';
import { useAsync } from '@/lib/hooks/useAsync';
import { colors, radius, space } from '@/lib/theme';

type FormState = 'idle' | 'submitting' | 'published' | 'held';

/**
 * Shared question/answer submit form. Sign-in gated; on 403 consent_required it
 * shows an inline consent checkbox and retries — publication consent is always
 * enforced server-side (same gate as reviews).
 */
function QAForm({
  submit,
  placeholder,
  submitLabel,
  publishedKey,
  heldKey,
  loginKey,
  maxLength,
  onPosted,
}: {
  submit: (body: string) => Promise<QAResult>;
  placeholder: string;
  submitLabel: string;
  publishedKey: string;
  heldKey: string;
  loginKey: string;
  maxLength: number;
  onPosted?: () => void;
}) {
  const { t } = useTranslation();
  const { data: session, isPending } = useSession();
  const [body, setBody] = useState('');
  const [needsConsent, setNeedsConsent] = useState(false);
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<FormState>('idle');
  const [errorKey, setErrorKey] = useState<string | null>(null);

  if (isPending) return null;

  if (!session) {
    return (
      <Link href="/sign-in" asChild>
        <Pressable accessibilityRole="button">
          <Text style={styles.link}>{t(loginKey)}</Text>
        </Pressable>
      </Link>
    );
  }

  if (state === 'published' || state === 'held') {
    return <Text style={styles.success}>{t(state === 'published' ? publishedKey : heldKey)}</Text>;
  }

  async function onSubmit() {
    if (!body.trim()) return;
    if (needsConsent && !consent) {
      setErrorKey('auth.consentRequired');
      return;
    }
    setState('submitting');
    setErrorKey(null);
    try {
      if (needsConsent) await recordReviewConsent();
      const res = await submit(body);
      setState(res.status === 'published' ? 'published' : 'held');
      onPosted?.();
    } catch (e) {
      setState('idle');
      if (e instanceof ApiRequestError && e.code === 'consent_required') {
        setNeedsConsent(true);
        setErrorKey(null);
        return;
      }
      setErrorKey('qa.submitError');
    }
  }

  return (
    <View style={styles.form}>
      <TextInput
        value={body}
        onChangeText={setBody}
        placeholder={placeholder}
        maxLength={maxLength}
        multiline
        style={styles.input}
      />
      {needsConsent ? (
        <Pressable
          style={styles.consentRow}
          onPress={() => {
            setConsent((c) => !c);
            setErrorKey(null);
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
        onPress={onSubmit}
        disabled={state === 'submitting'}
        accessibilityRole="button"
      >
        <Text style={styles.btnText}>{submitLabel}</Text>
      </Pressable>
    </View>
  );
}

export function QASection({
  slug,
  placeId,
  locale,
}: {
  slug: string;
  placeId: string;
  locale: string;
}) {
  const { t } = useTranslation();
  const qa = useAsync((signal) => getPlaceQuestions(slug, signal), [slug]);
  const questions = qa.data?.questions ?? [];

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t('qa.title')}</Text>
      <Text style={styles.guidelines}>{t('qa.guidelines')}</Text>

      <QAForm
        submit={(body) => postQuestion({ placeId, body, lang: locale })}
        placeholder={t('qa.askPlaceholder')}
        submitLabel={t('qa.submitQuestion')}
        publishedKey="qa.questionSubmitted"
        heldKey="qa.questionHeld"
        loginKey="qa.loginToAsk"
        maxLength={1000}
        onPosted={qa.reload}
      />

      {questions.length === 0 ? (
        qa.loading ? null : <Text style={styles.muted}>{t('qa.empty')}</Text>
      ) : (
        questions.map((q) => (
          <View key={q.id} style={styles.qCard}>
            <Text style={styles.qBody}>{q.body}</Text>
            <Text style={styles.meta}>
              {q.authorName} · {q.createdAt.slice(0, 10)}
            </Text>
            {q.answers.map((a) => (
              <View key={a.id} style={styles.aCard}>
                <Text style={styles.aBody}>{a.body}</Text>
                <Text style={styles.meta}>
                  {a.authorName} · {a.createdAt.slice(0, 10)}
                </Text>
              </View>
            ))}
            <QAForm
              submit={(body) => postAnswer({ questionId: q.id, body, lang: locale })}
              placeholder={t('qa.answerPlaceholder')}
              submitLabel={t('qa.submitAnswer')}
              publishedKey="qa.answerSubmitted"
              heldKey="qa.answerHeld"
              loginKey="qa.loginToAnswer"
              maxLength={2000}
              onPosted={qa.reload}
            />
          </View>
        ))
      )}

      <Text style={styles.disclaimer}>{t('qa.disclaimer')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: space.md, marginTop: space.sm },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  guidelines: { fontSize: 12, color: colors.textMuted },
  disclaimer: { fontSize: 11, color: colors.textMuted },
  muted: { fontSize: 13, color: colors.textMuted },
  qCard: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: space.md, gap: space.sm },
  qBody: { fontSize: 15, fontWeight: '600', color: colors.text },
  aCard: { borderStartWidth: 2, borderStartColor: colors.border, paddingStart: space.md, gap: space.xs },
  aBody: { fontSize: 14, color: colors.text },
  meta: { fontSize: 11, color: colors.textMuted },
  form: { gap: space.sm },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: space.md,
    fontSize: 14,
    color: colors.text,
    minHeight: 56,
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
  link: { color: colors.brand, fontWeight: '600' },
});
