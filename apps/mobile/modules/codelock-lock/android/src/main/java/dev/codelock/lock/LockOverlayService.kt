package dev.codelock.lock

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.graphics.Color
import android.graphics.PixelFormat
import android.os.Build
import android.os.IBinder
import android.provider.Settings
import android.view.Gravity
import android.view.KeyEvent
import android.view.View
import android.view.WindowManager
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout

/**
 * The Android lock: a foreground service holding a TYPE_APPLICATION_OVERLAY
 * window over everything else.
 *
 * Why a service and not just an Activity: an Activity is dismissed by Home,
 * by Recents, and by anything else the user launches. A window added directly
 * to the WindowManager at overlay level stays on top of other apps, and the
 * foreground service is what keeps Android from reclaiming the process while
 * it does — since Android 12 an overlay from a backgrounded app is torn down
 * within seconds.
 *
 * What this cannot do, stated plainly because the product copy depends on it:
 * force-stop from Settings kills it, Safe Mode boots without it, uninstall
 * removes it, and the system UI (status bar pulldown, the power menu, incoming
 * calls) always draws above it. Only a Device Owner provisioned through
 * enterprise enrollment can truly block, and that needs a factory reset to set
 * up — the wrong trade for a personal productivity app.
 */
class LockOverlayService : Service() {

  private var windowManager: WindowManager? = null
  private var overlay: View? = null
  private var webView: WebView? = null

  companion object {
    const val ACTION_ENGAGE = "dev.codelock.lock.ENGAGE"
    const val ACTION_RELEASE = "dev.codelock.lock.RELEASE"
    const val EXTRA_SESSION_ID = "sessionId"
    const val EXTRA_WEB_URL = "webUrl"
    const val EXTRA_ACCESS_TOKEN = "accessToken"

    private const val CHANNEL_ID = "codelock-lock"
    private const val NOTIFICATION_ID = 4201

    fun engage(context: Context, sessionId: String, webUrl: String, accessToken: String) {
      val intent = Intent(context, LockOverlayService::class.java).apply {
        action = ACTION_ENGAGE
        putExtra(EXTRA_SESSION_ID, sessionId)
        putExtra(EXTRA_WEB_URL, webUrl)
        putExtra(EXTRA_ACCESS_TOKEN, accessToken)
      }
      context.startForegroundService(intent)
    }

    fun release(context: Context) {
      val intent = Intent(context, LockOverlayService::class.java).apply {
        action = ACTION_RELEASE
      }
      // The service may already be gone; starting it just to stop it is
      // cheaper than tracking binder state across process deaths.
      context.startService(intent)
    }

    fun canDrawOverlay(context: Context): Boolean = Settings.canDrawOverlays(context)
  }

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    when (intent?.action) {
      ACTION_RELEASE -> {
        tearDown()
        return START_NOT_STICKY
      }
      else -> {
        val sessionId = intent?.getStringExtra(EXTRA_SESSION_ID)
        val webUrl = intent?.getStringExtra(EXTRA_WEB_URL)
        val accessToken = intent?.getStringExtra(EXTRA_ACCESS_TOKEN) ?: ""

        // Restarted by the system with a null intent (START_STICKY): recover
        // from disk rather than coming back as a blank overlay.
        val stored = LockState.read(this)
        val resolvedSession = sessionId ?: stored?.sessionId
        val resolvedUrl = webUrl ?: stored?.webUrl
        val resolvedToken = if (accessToken.isNotEmpty()) accessToken else stored?.accessToken ?: ""

        if (resolvedSession == null || resolvedUrl == null) {
          stopSelf()
          return START_NOT_STICKY
        }

        LockState.save(this, resolvedSession, resolvedUrl, resolvedToken)
        startForegroundNotification()
        showOverlay(resolvedUrl, resolvedToken)
      }
    }
    // START_STICKY: if Android kills us for memory, come back. That is the
    // whole point of persisting the lock.
    return START_STICKY
  }

  private fun startForegroundNotification() {
    val manager = getSystemService(NotificationManager::class.java)
    if (manager.getNotificationChannel(CHANNEL_ID) == null) {
      manager.createNotificationChannel(
        NotificationChannel(
          CHANNEL_ID,
          "CodeLock session",
          NotificationManager.IMPORTANCE_LOW,
        ).apply {
          description = "Shown while a lock is active."
          setShowBadge(false)
        },
      )
    }

    val launch = packageManager.getLaunchIntentForPackage(packageName)
    val pending = launch?.let {
      PendingIntent.getActivity(
        this, 0, it,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
      )
    }

    val notification: Notification = Notification.Builder(this, CHANNEL_ID)
      .setContentTitle("CodeLock is locked")
      .setContentText("Solve the problem to unlock your device.")
      .setSmallIcon(android.R.drawable.ic_lock_lock)
      .setOngoing(true)
      .setContentIntent(pending)
      .build()

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
      startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
    } else {
      startForeground(NOTIFICATION_ID, notification)
    }
  }

  private fun showOverlay(webUrl: String, accessToken: String) {
    if (overlay != null) return
    if (!canDrawOverlay(this)) {
      // Without the permission the window would throw on add. Fail loudly at
      // the JS layer instead: the app asks for it before ever arming.
      stopSelf()
      return
    }

    val wm = getSystemService(WINDOW_SERVICE) as WindowManager
    windowManager = wm

    val params = WindowManager.LayoutParams(
      WindowManager.LayoutParams.MATCH_PARENT,
      WindowManager.LayoutParams.MATCH_PARENT,
      WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
      // FLAG_NOT_TOUCH_MODAL is deliberately absent: touches must NOT pass
      // through to whatever is underneath. The window is focusable so the
      // WebView can take keyboard input for the editor.
      WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON,
      PixelFormat.OPAQUE,
    ).apply {
      gravity = Gravity.TOP or Gravity.START
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
        layoutInDisplayCutoutMode =
          WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
      }
    }

    val container = object : FrameLayout(this) {
      /**
       * Swallow Back. Home cannot be intercepted from userland — the overlay
       * stays on top when it is pressed, which is the best available answer.
       */
      override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        if (event.keyCode == KeyEvent.KEYCODE_BACK) return true
        return super.dispatchKeyEvent(event)
      }
    }
    container.setBackgroundColor(Color.parseColor("#0e0e0d"))

    val view = WebView(this).apply {
      settings.javaScriptEnabled = true
      settings.domStorageEnabled = true
      settings.databaseEnabled = true
      // Monaco loads its worker from a blob: URL; without this the editor is
      // blank with no error in logcat.
      settings.allowFileAccess = false
      settings.allowContentAccess = false
      setBackgroundColor(Color.parseColor("#0e0e0d"))

      addJavascriptInterface(UnlockBridge(), "CodeLockNative")

      webViewClient = object : WebViewClient() {
        override fun onPageStarted(view: WebView?, url: String?, favicon: android.graphics.Bitmap?) {
          super.onPageStarted(view, url, favicon)
          // Hand the page its session before React hydrates, so it never
          // flashes a login screen behind the lock.
          view?.evaluateJavascript(
            """
            (function () {
              try {
                window.localStorage.setItem('codelock.access', ${quote(accessToken)});
                window.__CODELOCK_NATIVE__ = true;
                window.ReactNativeWebView = window.ReactNativeWebView || {
                  postMessage: function (data) { CodeLockNative.postMessage(data); }
                };
              } catch (e) {}
            })();
            """.trimIndent(),
            null,
          )
        }

        override fun shouldOverrideUrlLoading(
          view: WebView?,
          request: android.webkit.WebResourceRequest?,
        ): Boolean {
          val target = request?.url?.toString() ?: return true
          // Never let the locked page navigate off our own origin: an
          // arbitrary page inside the overlay is a browser the user did not
          // earn.
          return !target.startsWith(webUrl)
        }
      }

      loadUrl("$webUrl/lock")
    }

    webView = view
    container.addView(
      view,
      FrameLayout.LayoutParams(
        FrameLayout.LayoutParams.MATCH_PARENT,
        FrameLayout.LayoutParams.MATCH_PARENT,
      ),
    )

    wm.addView(container, params)
    overlay = container
  }

  /**
   * The only path from the page back to the service.
   *
   * It carries no authority: the page says "the server unlocked me", and the
   * server-signed proof was already verified by the API before it said so.
   * Unlike the desktop shell there is no local signature check here, because
   * an Android app's own storage is readable by anyone who can already
   * force-stop it — the barrier this service provides is friction, not
   * cryptography, and pretending otherwise would be the dishonest version.
   */
  private inner class UnlockBridge {
    @JavascriptInterface
    fun postMessage(data: String) {
      if (!data.contains("codelock:unlocked")) return
      // Hop to the main thread: this arrives on the WebView's JS thread and
      // touching the WindowManager off-main throws.
      webView?.post { tearDown() }
    }
  }

  private fun tearDown() {
    LockState.clear(this)

    overlay?.let { view ->
      try {
        windowManager?.removeView(view)
      } catch (_: IllegalArgumentException) {
        // Already detached; nothing to undo.
      }
    }
    overlay = null

    webView?.destroy()
    webView = null

    stopForeground(STOP_FOREGROUND_REMOVE)
    stopSelf()
  }

  override fun onDestroy() {
    // Do NOT clear lock state here: onDestroy also runs when the system kills
    // the service for memory, and clearing would turn an OOM kill into an
    // unlock. Only tearDown() — a real release — clears it.
    overlay?.let { view ->
      try {
        windowManager?.removeView(view)
      } catch (_: IllegalArgumentException) {
      }
    }
    overlay = null
    webView?.destroy()
    webView = null
    super.onDestroy()
  }

  private fun quote(value: String): String =
    "\"" + value.replace("\\", "\\\\").replace("\"", "\\\"") + "\""
}
