import { Alert, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { NativeLock, enforcement, type Enforcement } from '../modules/codelock-lock';

/**
 * What each platform can actually enforce.
 *
 * The answer comes from the native module rather than from `Platform.OS`, so
 * "we can block" is reported by the code that would have to do the blocking.
 * A user who has not granted the overlay permission is on the soft lock too,
 * and the UI says so — an Android device without that grant is not meaningfully
 * different from an iPhone here.
 */
export type EnforcementLevel = Enforcement;

export function enforcementLevel(): EnforcementLevel {
  return enforcement();
}

export const ENFORCEMENT_COPY: Record<EnforcementLevel, string> = {
  overlay:
    'CodeLock will cover other apps when the timer fires, and comes back after ' +
    'a reboot. Force-stopping it from Settings, booting into Safe Mode, or ' +
    'uninstalling still gets past it.',
  soft:
    Platform.OS === 'ios'
      ? 'iOS does not let any app block another. CodeLock takes over its own ' +
        'screen and keeps reminding you, but it cannot stop you switching apps. ' +
        'Use Screen Time alongside it if you want a hard limit.'
      : 'Without "Display over other apps", CodeLock can only lock its own ' +
        'screen. Grant the permission to have it cover other apps.',
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
 * through a Settings screen the user has to visit themselves. Explain first,
 * then hand them over; an unexplained jump to a system settings page is how
 * people decide an app is malware.
 */
export async function ensureOverlayPermission(): Promise<boolean> {
  if (!NativeLock.isSupported) return false;
  if (NativeLock.canDrawOverlay()) return true;

  return new Promise((resolve) => {
    Alert.alert(
      'Allow CodeLock to cover other apps',
      'Android needs you to turn this on in Settings. Without it, the lock ' +
        'screen can only appear while CodeLock is already open.',
      [
        { text: 'Not now', style: 'cancel', onPress: () => resolve(false) },
        {
          text: 'Open Settings',
          onPress: () => {
            NativeLock.openOverlaySettings();
            resolve(false);
          },
        },
      ],
    );
  });
}

/**
 * Ask for a battery-optimisation exemption.
 *
 * Xiaomi, Huawei, Samsung and OnePlus kill unexempted foreground services
 * within minutes. On those devices the lock quietly ends early, which is worse
 * than never having locked — the user believes they are committed when they
 * are not.
 */
export function offerBatteryExemption(): void {
  if (!NativeLock.isSupported) return;
  Alert.alert(
    'Keep CodeLock running',
    'Some phones stop background apps to save battery, which would end a lock ' +
      'early. Exempting CodeLock keeps the timer honest.',
    [
      { text: 'Not now', style: 'cancel' },
      { text: 'Open Settings', onPress: () => NativeLock.openBatterySettings() },
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
