import { useCallback, useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  currentPushSupport,
  getPermissionStatus,
  requestExpoPushToken,
} from '@/lib/push/register';
import { registerExpoPushToken, unregisterExpoPushToken } from '@/lib/api/push';
import { colors, radius, space } from '@/lib/theme';

type UIState = 'loading' | 'hidden' | 'default' | 'granted' | 'denied' | 'busy';

/**
 * Ramadan/Eid push opt-in for the native app. Renders nothing unless Expo push
 * is actually usable (real device, dev/standalone build, EAS projectId) — so it
 * is inert in Expo Go / simulators / before `eas init`. Permission is requested
 * only inside the tap handler. Consent is enforced on the server row.
 */
export function PushOptIn() {
  const { t, i18n } = useTranslation();
  const [state, setState] = useState<UIState>('loading');
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (currentPushSupport() !== 'ok') {
        if (!cancelled) setState('hidden');
        return;
      }
      const status = await getPermissionStatus();
      if (cancelled) return;
      setState(status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'default');
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const enable = useCallback(async () => {
    setState('busy');
    const tok = await requestExpoPushToken(); // prompts inside the gesture
    if (!tok) {
      setState('default');
      return;
    }
    try {
      await registerExpoPushToken({
        token: tok,
        platform: Platform.OS === 'ios' ? 'ios' : 'android',
        locale: i18n.language,
      });
      setToken(tok);
      setState('granted');
    } catch {
      setState('default');
    }
  }, [i18n.language]);

  const disable = useCallback(async () => {
    setState('busy');
    try {
      const tok = token ?? (await requestExpoPushToken());
      if (tok) await unregisterExpoPushToken(tok);
    } catch {
      /* best-effort */
    }
    setToken(null);
    setState('default');
  }, [token]);

  if (state === 'loading' || state === 'hidden') return null;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>🔔 {t('push.title')}</Text>
      <Text style={styles.intro}>{t('push.intro')}</Text>

      {state === 'denied' ? <Text style={styles.blocked}>{t('push.blocked')}</Text> : null}

      {state === 'granted' ? (
        <View style={styles.row}>
          <Text style={styles.enabled}>✓ {t('push.enabled')}</Text>
          <Pressable style={styles.ghostBtn} onPress={disable} accessibilityRole="button">
            <Text style={styles.ghostText}>{t('push.disable')}</Text>
          </Pressable>
        </View>
      ) : null}

      {state === 'default' || state === 'busy' ? (
        <Pressable
          style={[styles.btn, state === 'busy' && styles.btnDisabled]}
          onPress={enable}
          disabled={state === 'busy'}
          accessibilityRole="button"
        >
          <Text style={styles.btnText}>{t('push.enable')}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: space.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: space.lg,
  },
  title: { fontSize: 15, fontWeight: '700', color: colors.text },
  intro: { fontSize: 13, color: colors.textMuted },
  blocked: { fontSize: 13, color: colors.textMuted },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  enabled: { fontSize: 14, fontWeight: '600', color: colors.certified },
  btn: {
    alignSelf: 'flex-start',
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    paddingVertical: space.sm,
    paddingHorizontal: space.xl,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
  ghostBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: space.xs,
    paddingHorizontal: space.lg,
  },
  ghostText: { color: colors.text, fontWeight: '600' },
});
