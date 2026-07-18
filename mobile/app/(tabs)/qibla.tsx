import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { distanceToKaabaKm, qiblaBearing, relativeRotation } from '@/lib/prayer/qibla';
import { getQiblaFix, subscribeHeading } from '@/lib/location/heading';
import { colors, radius, space } from '@/lib/theme';

type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; bearing: number; distanceKm: number }
  | { status: 'denied' };

export default function QiblaScreen() {
  const { t } = useTranslation();
  const [state, setState] = useState<State>({ status: 'idle' });
  const [heading, setHeading] = useState<number | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  // stop the heading subscription on unmount
  useEffect(() => () => cleanupRef.current?.(), []);

  async function locate() {
    setState({ status: 'loading' });
    const fix = await getQiblaFix();
    if (!fix) {
      setState({ status: 'denied' });
      return;
    }
    // coordinates stay on-device — used only for this calculation (PDPA)
    setState({
      status: 'ready',
      bearing: Math.round(qiblaBearing(fix.latitude, fix.longitude) * 10) / 10,
      distanceKm: Math.round(distanceToKaabaKm(fix.latitude, fix.longitude)),
    });
    // progressive enhancement: rotate the arrow with the live compass heading
    cleanupRef.current = await subscribeHeading(setHeading);
  }

  const ready = state.status === 'ready' ? state : null;
  const live = ready && heading !== null;
  const rotation = ready ? (live ? relativeRotation(ready.bearing, heading) : ready.bearing) : 0;

  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        {ready ? (
          <>
            <View
              style={styles.dial}
              accessibilityRole="image"
              accessibilityLabel={t('qibla.degreesFromNorth', { degrees: ready.bearing })}
            >
              <Text style={[styles.arrow, { transform: [{ rotate: `${rotation}deg` }] }]}>🧭</Text>
            </View>
            <Text style={styles.degrees}>{t('qibla.degreesFromNorth', { degrees: ready.bearing })}</Text>
            <Text style={styles.muted}>
              {t('qibla.distanceToKaaba', { km: String(ready.distanceKm) })}
            </Text>
            <Text style={styles.hint}>{live ? t('qibla.compassHint') : t('qibla.fallbackHint')}</Text>
          </>
        ) : (
          <>
            <Text style={styles.muted}>{t('qibla.fallbackHint')}</Text>
            <Pressable
              style={[styles.btn, state.status === 'loading' && styles.btnDisabled]}
              onPress={locate}
              disabled={state.status === 'loading'}
              accessibilityRole="button"
            >
              <Text style={styles.btnText}>{state.status === 'loading' ? '…' : t('qibla.title')}</Text>
            </Pressable>
            {state.status === 'denied' ? (
              <Text style={styles.warn}>{t('qibla.permissionNeeded')}</Text>
            ) : null}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: space.lg },
  card: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: space.xl,
  },
  dial: {
    height: 176,
    width: 176,
    borderRadius: 88,
    borderWidth: 4,
    borderColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: { fontSize: 64 },
  degrees: { fontSize: 24, fontWeight: '800', color: colors.text },
  muted: { color: colors.textMuted, textAlign: 'center' },
  hint: { color: colors.textMuted, fontSize: 12, textAlign: 'center' },
  btn: {
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    paddingVertical: space.md,
    paddingHorizontal: space.xl,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
  warn: { color: colors.friendly, fontSize: 13, textAlign: 'center' },
});
