package dev.codelock.lock

import android.content.Intent
import android.net.Uri
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * The JS surface of the Android lock.
 *
 * Deliberately narrow: engage, release, ask about permissions, send the user to
 * the Settings screen that grants them. There is no "am I allowed to unlock"
 * question here — that is answered by the API, and the overlay comes down only
 * when the page inside it reports a server-issued unlock.
 */
class CodeLockLockModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("CodeLockLock")

    Constants(
      "isSupported" to true,
      "platform" to "android",
    )

    Function("canDrawOverlay") {
      val context = appContext.reactContext ?: return@Function false
      Settings.canDrawOverlays(context)
    }

    /**
     * Android will not grant SYSTEM_ALERT_WINDOW from a runtime dialog. The
     * only route is this Settings screen, which the user has to complete by
     * hand — so the app explains why before sending them there.
     */
    Function("openOverlaySettings") {
      val context = appContext.reactContext ?: return@Function false
      val intent = Intent(
        Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
        Uri.parse("package:${context.packageName}"),
      ).apply { addFlags(Intent.FLAG_ACTIVITY_NEW_TASK) }
      context.startActivity(intent)
      true
    }

    /**
     * OEM battery managers (Xiaomi, Huawei, Samsung, OnePlus) kill unexempted
     * foreground services within minutes, which would silently end a lock.
     */
    Function("openBatterySettings") {
      val context = appContext.reactContext ?: return@Function false
      val intent = Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS)
        .apply { addFlags(Intent.FLAG_ACTIVITY_NEW_TASK) }
      context.startActivity(intent)
      true
    }

    Function("isLocked") {
      val context = appContext.reactContext ?: return@Function false
      LockState.isLive(LockState.read(context))
    }

    Function("engage") { sessionId: String, webUrl: String, accessToken: String ->
      val context = appContext.reactContext ?: return@Function false
      if (!Settings.canDrawOverlays(context)) return@Function false
      LockOverlayService.engage(context, sessionId, webUrl, accessToken)
      true
    }

    Function("release") {
      val context = appContext.reactContext ?: return@Function false
      LockOverlayService.release(context)
      true
    }
  }
}
