import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { pushSupport, type PushSupport } from './support';

const CHANNEL_ID = 'announcements';

/** EAS project id — written into app config by `eas init`. Undefined until then. */
export function getProjectId(): string | undefined {
  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
  return extra?.eas?.projectId ?? Constants.easConfig?.projectId;
}

export function currentPushSupport(): PushSupport {
  return pushSupport({
    os: Platform.OS,
    isDevice: Device.isDevice,
    executionEnvironment: Constants.executionEnvironment,
    projectId: getProjectId(),
  });
}

export async function getPermissionStatus(): Promise<Notifications.PermissionStatus> {
  const perm = await Notifications.getPermissionsAsync();
  return perm.status;
}

/** Android requires a channel before a token/notification; idempotent. */
export async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Announcements',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

/**
 * Request permission (MUST be called from a user gesture) and return the Expo
 * push token, or null if permission was denied / no project id / any failure.
 * Never throws — the caller keeps the sensor-free UI.
 */
export async function requestExpoPushToken(): Promise<string | null> {
  try {
    await ensureAndroidChannel();
    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== 'granted' && existing.canAskAgain) {
      status = (await Notifications.requestPermissionsAsync()).status;
    }
    if (status !== 'granted') return null;

    const projectId = getProjectId();
    if (!projectId) return null;

    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return token.data;
  } catch {
    return null;
  }
}
