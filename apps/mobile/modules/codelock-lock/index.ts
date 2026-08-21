import { requireNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

/**
 * Native lock enforcement, such as each platform permits.
 *
 * The shape is identical on both platforms and `isSupported` is the only thing
 * callers branch on. That is deliberate: the alternative is `Platform.OS`
 * checks scattered through the UI, each of which is a place someone can write
 * a claim the platform will not honour.
 */
export interface CodeLockLockModule {
  /** False on iOS. No public API there lets one app block another. */
  readonly isSupported: boolean;
  readonly platform: 'android' | 'ios';

  /** Android: has the user granted "Display over other apps"? */
  canDrawOverlay(): boolean;
  /** Android: open the Settings screen that grants it. Cannot be a dialog. */
  openOverlaySettings(): boolean;
  /** Android: open battery-optimisation settings, so OEMs stop killing us. */
  openBatterySettings(): boolean;

  /** Is a lock recorded as live in native storage right now? */
  isLocked(): boolean;

  /**
   * Raise the overlay and persist the lock. Returns false when the platform
   * or the permissions cannot deliver it — callers must not treat that as
   * success and must fall back to the soft lock.
   */
  engage(sessionId: string, webUrl: string, accessToken: string): boolean;

  /** Drop the overlay and clear persisted state. */
  release(): boolean;
}

/**
 * A stand-in for Expo Go and the web, where no native module is linked.
 *
 * It refuses everything rather than pretending, so a developer running in Expo
 * Go sees the soft lock and its copy — not a silent no-op that looks like the
 * real thing until the day it matters.
 */
const unavailable: CodeLockLockModule = {
  isSupported: false,
  platform: Platform.OS === 'android' ? 'android' : 'ios',
  canDrawOverlay: () => false,
  openOverlaySettings: () => false,
  openBatterySettings: () => false,
  isLocked: () => false,
  engage: () => false,
  release: () => false,
};

function load(): CodeLockLockModule {
  try {
    return requireNativeModule<CodeLockLockModule>('CodeLockLock');
  } catch {
    return unavailable;
  }
}

export const NativeLock: CodeLockLockModule = load();

/** What this device can actually enforce, in one word the UI can render. */
export type Enforcement = 'overlay' | 'soft';

export function enforcement(): Enforcement {
  return NativeLock.isSupported && NativeLock.canDrawOverlay() ? 'overlay' : 'soft';
}
