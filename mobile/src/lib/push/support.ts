/**
 * Decide whether Expo push is usable, purely from environment facts (so it
 * unit-tests without expo/react-native). The adapter (register.ts) feeds the
 * real Platform/Device/Constants values in.
 */
export type PushSupport = 'ok' | 'expo-go' | 'no-device' | 'no-project' | 'web';

export interface PushSupportInput {
  os: string; // Platform.OS
  isDevice: boolean; // Device.isDevice (simulators can't get a token)
  executionEnvironment: string; // Constants.executionEnvironment ('storeClient' = Expo Go)
  projectId: string | undefined; // EAS project id (from app config)
}

export function pushSupport(input: PushSupportInput): PushSupport {
  if (input.os === 'web') return 'web';
  if (!input.isDevice) return 'no-device';
  // Expo Go dropped remote push in SDK 53+; a dev/standalone build is required
  if (input.executionEnvironment === 'storeClient') return 'expo-go';
  if (!input.projectId) return 'no-project';
  return 'ok';
}
