# CodeLock Mobile

Expo SDK 57 (React Native 0.87, React 19). The lock screen is the web app in a
WebView (Monaco is a browser editor); everything native exists to make the lock
harder to walk away from.

## What each platform can actually do

| Platform | Enforcement | Reality |
|---|---|---|
| Android | Overlay via `SYSTEM_ALERT_WINDOW` + foreground service | Covers other apps, survives a reboot and a process kill. Defeated by force-stop, Safe Mode, uninstall, or an OEM battery manager. |
| iOS | None | **No public API lets one app block another.** CodeLock owns its own screen and sends notifications; that is the ceiling. Pair with Screen Time for a hard limit. |

This is a platform constraint, not a missing feature. Any app claiming a true
iOS block is either using the `FamilyControls` entitlement (which Apple grants
case by case, and which requires a separate `DeviceActivityMonitor` extension)
or misrepresenting what it does.

Full escape-attempt results: [`docs/ESCAPE-MATRIX.md`](../../docs/ESCAPE-MATRIX.md).

## The native module

`modules/codelock-lock/` is a local Expo module, so it auto-links on prebuild
with no `MainApplication` patching and no post-prebuild hand-edits.

```
modules/codelock-lock/
  index.ts                     JS surface; falls back to a refuse-everything
                               stub when no native module is linked
  android/                     LockOverlayService, BootReceiver, LockState
  ios/                         reports isSupported: false, deliberately
```

Android pieces:

- **`LockOverlayService`** — foreground service (`specialUse`) holding a
  `TYPE_APPLICATION_OVERLAY` window with a `WebView` on `${webUrl}/lock`.
  `START_STICKY`, recovers from stored state on a null-intent restart.
- **`LockState`** — `SharedPreferences`, written with `commit()` rather than
  `apply()` because the process may die in the next instant.
- **`BootReceiver`** — `BOOT_COMPLETED` and `MY_PACKAGE_REPLACED`, so neither
  a reboot nor an app update is an unlock.

The service declares itself in the module's own `AndroidManifest.xml`. The
previous `plugins/with-android-overlay.js` declared a `.LockOverlayService`
class that did not exist anywhere — starting a lock would have crashed — and
has been removed.

## Permissions the user must accept

1. **Notifications** — runtime dialog, on first sign-in.
2. **Display over other apps** — *not* a dialog. Android only grants this from
   Settings → Apps → Special app access. The app explains why, then opens it.
3. **Battery optimisation exemption** — offered after 2. Xiaomi, Huawei,
   Samsung and OnePlus kill unexempted foreground services within minutes,
   which would end a lock early and silently.

## Running it

Expo Go **cannot** host this app — the overlay permission and foreground
service need a development build.

```bash
npx expo prebuild --clean
```

```bash
npx expo run:android
```

## Builds

```bash
eas build --platform android --profile production
```

```bash
eas build --platform ios --profile production
```

Set `extra.apiUrl` and `extra.webUrl` in `app.json` to your deployed hosts
before building.
