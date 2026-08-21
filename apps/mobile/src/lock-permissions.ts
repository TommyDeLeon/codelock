import { Alert, Linking, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

/**
 * What each platform can actually enforce.
 *
 * This module exists mostly to be honest in code rather than only in docs, so
 * the UI can tell the user the truth about their device instead of implying a
 * guarantee it cannot keep.
 */
export type EnforcementLevel = 'overlay' | 'notification-only';

export function enforcementLevel(): EnforcementLevel {
  // Android can draw over other apps with SYSTEM_ALERT_WINDOW. iOS has no
  // equivalent public API — not a missing feature, a deliberate platform
  // restriction — so the honest answer there is "we can nag, not block".
  return Platform.OS === 'android' ? 'overlay' : 'notification-only';
}

export const ENFORCEMENT_COPY: Record<EnforcementLevel, string> = {
  overlay:
    'CodeLock can cover other apps once you grant "Display over other apps". ' +
    'Force-stopping the app from Settings still gets past it.',
  'notification-only':
    'iOS does not let any app block another. CodeLock will take over its own ' +
    'screen and keep reminding you, but it cannot stop you switching apps. ' +
    'Use Screen Time alongside it if you want a hard limit.',
};

export async function ensureNotificationPermission(): Promise<boolean> {
  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) return true;

  const requested = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowSound: true, allowBadge: false, allowCriticalAlerts: false },
  });
  return requested.granted;
}

/**
 * Overlay permission cannot be requested with a dialog — Android only allows it
 * through a Settings screen the user has to visit themselves.
 */
export async function ensureOverlayPermission(): Promise<void> {
  if (Platform.OS !== 'android') return;

  Alert.alert(
    'Allow CodeLock to cover other apps',
    'Android needs you to turn this on in Settings. Without it, the lock ' +
      'screen can only appear while CodeLock is already open.',
    [
      { text: 'Not now', style: 'cancel' },
      {
        text: 'Open Settings',
        onPress: () => {
          void Linking.openSettings();
        },
      },
    ],
  );
}

/**
 * Schedule the local notification that fires when the timer expires.
 *
 * The server owns the real deadline; this is only the nudge that brings the
 * user back to the app. Losing it (phone off, notifications denied) delays the
 * lock but cannot skip it — the session is still LOCKED server-side.
 */
export async function scheduleLockNotification(fireAt: Date): Promise<string | null> {
  const seconds = Math.max(1, Math.round((fireAt.getTime() - Date.now()) / 1000));

  try {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Time is up',
        body: 'Solve the problem to unlock CodeLock.',
        sound: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
        sticky: Platform.OS === 'android',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds,
        channelId: 'codelock-timer',
      },
    });
  } catch {
    return null;
  }
}

export async function cancelLockNotification(id: string | null): Promise<void> {
  if (id) await Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined);
}
