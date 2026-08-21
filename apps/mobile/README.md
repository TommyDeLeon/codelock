# CodeLock Mobile

Expo SDK 57 (React Native 0.87, React 19). The lock screen is the web app in a WebView (Monaco is a browser
editor); everything native exists to make the lock harder to walk away from.

## What each platform can actually do

| Platform | Enforcement | Reality |
|---|---|---|
| Android | Overlay via `SYSTEM_ALERT_WINDOW` + foreground service | Covers other apps. Defeated by force-stop, Safe Mode, or uninstall. |
| iOS | None | **No public API lets one app block another.** CodeLock owns its own screen and sends notifications; that is the ceiling. Pair with Screen Time for a hard limit. |

This is a platform constraint, not a missing feature. Any app claiming a true
iOS block is either using the `FamilyControls` entitlement (which Apple grants
case by case, and which requires a separate `DeviceActivityMonitor` extension)
or misrepresenting what it does.

## Running it

Expo Go **cannot** host this app — the overlay permission and foreground
service need a development build.

```bash
npx expo prebuild --clean
npx expo run:android
```

## Android: the overlay service

`plugins/with-android-overlay.js` declares `.LockOverlayService` in the
manifest. After the first `prebuild`, add the Kotlin implementation at
`android/app/src/main/java/dev/codelock/app/LockOverlayService.kt`. It needs to:

1. Start as a foreground service with `FOREGROUND_SERVICE_TYPE_SPECIAL_USE`.
2. Add a `TYPE_APPLICATION_OVERLAY` window with `FLAG_NOT_TOUCH_MODAL` cleared.
3. Host a `WebView` pointed at `${webUrl}/lock`.
4. Stop itself when the WebView posts `codelock:unlocked`.

Prompt users for battery-optimisation exemption as well — Xiaomi, Huawei, and
Samsung kill unexempted foreground services within minutes.

## Builds

```bash
eas build --platform android --profile production
eas build --platform ios --profile production
```

Set `extra.apiUrl` and `extra.webUrl` in `app.json` to your deployed hosts
before building.
