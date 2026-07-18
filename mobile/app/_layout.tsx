import '@/lib/auth/client'; // side effect: wire the bearer-token provider into the API client
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { I18nextProvider } from 'react-i18next';
import { i18next, initI18n } from '@/lib/i18n';
import { useSavedStore } from '@/lib/saved/store';
import { useNotificationRouting } from '@/lib/push/handler';
import { colors } from '@/lib/theme';

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  // deep-link when an announcement notification is tapped (cold start + running).
  // Gated on `ready` so routing waits until the <Stack> below is mounted.
  useNotificationRouting(ready);

  useEffect(() => {
    let mounted = true;
    initI18n().finally(() => {
      if (mounted) setReady(true);
    });
    void useSavedStore.getState().hydrate();
    return () => {
      mounted = false;
    };
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <I18nextProvider i18n={i18next}>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerTintColor: colors.brand }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </I18nextProvider>
    </SafeAreaProvider>
  );
}
