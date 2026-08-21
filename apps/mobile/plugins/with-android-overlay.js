const { withAndroidManifest, AndroidConfig } = require('expo/config-plugins');

/**
 * Android lock affordances.
 *
 * `SYSTEM_ALERT_WINDOW` ("Display over other apps") is what lets CodeLock draw
 * the lock screen on top of whatever the user is doing. It is a special
 * permission: it cannot be granted by a runtime prompt, only by sending the
 * user to Settings, which src/lock-permissions.ts does.
 *
 * The honest limits, so nobody ships this believing otherwise:
 *
 *   - An overlay is defeatable. Recents, Back, force-stop from Settings, and
 *     Safe Mode all get past it. Only a Device Owner (DPC) provisioned via
 *     enterprise enrollment can truly block, and that requires a factory reset
 *     to set up — wrong trade for a personal productivity app.
 *   - Android 12+ kills overlays drawn by an app without a foreground service,
 *     hence FOREGROUND_SERVICE_SPECIAL_USE and the persistent notification.
 *   - Aggressive OEM battery managers (Xiaomi, Huawei, Samsung) will kill the
 *     service unless the user exempts the app, so the app asks for that too.
 *
 * This plugin only edits the manifest. It does not add Java/Kotlin sources, so
 * `expo prebuild` stays reproducible; the service class it declares lives in
 * android/app/src/main/java/dev/codelock/app/LockOverlayService.kt (see
 * apps/mobile/README.md for the file, added after the first prebuild).
 */
module.exports = function withAndroidOverlay(config) {
  return withAndroidManifest(config, (mod) => {
    const manifest = mod.modResults;
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(manifest);

    application.service = application.service ?? [];

    const alreadyDeclared = application.service.some(
      (service) => service.$['android:name'] === '.LockOverlayService',
    );

    if (!alreadyDeclared) {
      application.service.push({
        $: {
          'android:name': '.LockOverlayService',
          'android:exported': 'false',
          // Required from Android 14: a foreground service must declare why it
          // runs. "specialUse" is the correct bucket for a screen-locking tool.
          'android:foregroundServiceType': 'specialUse',
        },
        property: [
          {
            $: {
              'android:name':
                'android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE',
              'android:value':
                'Displays a full-screen coding challenge that the user must solve to regain access to their device.',
            },
          },
        ],
      });
    }

    return mod;
  });
};
