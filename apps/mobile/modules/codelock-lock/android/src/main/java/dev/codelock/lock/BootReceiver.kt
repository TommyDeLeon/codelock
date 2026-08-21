package dev.codelock.lock

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/**
 * Rebooting must not be an unlock.
 *
 * Without this, "hold power, restart" is a ten-second bypass that leaves no
 * trace. With it, the overlay is back before the launcher settles.
 *
 * MY_PACKAGE_REPLACED is here for the same reason: an app update mid-session
 * restarts the process, and a lock that an update dissolves is a lock with a
 * scheduled expiry date.
 */
class BootReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val action = intent.action
    if (action != Intent.ACTION_BOOT_COMPLETED && action != Intent.ACTION_MY_PACKAGE_REPLACED) {
      return
    }

    val lock = LockState.read(context)
    if (!LockState.isLive(lock)) {
      // Stale debris from a much older run. Do not honour it, do not keep it.
      if (lock != null) LockState.clear(context)
      return
    }

    // Overlay permission can be revoked while the device was off. Nothing to
    // do about that here — the app surfaces it on next open.
    if (!LockOverlayService.canDrawOverlay(context)) return

    LockOverlayService.engage(context, lock!!.sessionId, lock.webUrl, lock.accessToken)
  }
}
