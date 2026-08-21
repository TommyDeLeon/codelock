package dev.codelock.lock

import android.content.Context

/**
 * The lock, written to disk.
 *
 * Same reasoning as the desktop shell: a lock that only exists in memory is
 * defeated by killing the process, and on Android the OS kills processes as a
 * matter of routine. SharedPreferences survives a swipe from Recents, a
 * low-memory kill, and a reboot — which is why BootReceiver can bring the
 * overlay back.
 *
 * It does not survive "Clear data" or an uninstall, and it is not meant to.
 * Those are deliberate acts, which is the bar a commitment device raises the
 * escape to. See docs/ESCAPE-MATRIX.md.
 */
object LockState {
  private const val PREFS = "codelock.lock"
  private const val KEY_SESSION = "sessionId"
  private const val KEY_ENGAGED_AT = "engagedAt"
  private const val KEY_EXPIRES_AT = "expiresAt"
  private const val KEY_WEB_URL = "webUrl"
  private const val KEY_ACCESS_TOKEN = "accessToken"

  /** Twelve hours. Longer than any legitimate session, short enough to save you. */
  const val MAX_LOCK_LIFETIME_MS = 12L * 60L * 60L * 1000L

  data class Lock(
    val sessionId: String,
    val engagedAt: Long,
    val expiresAt: Long,
    val webUrl: String,
    val accessToken: String,
  )

  private fun prefs(context: Context) =
    context.applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

  fun save(context: Context, sessionId: String, webUrl: String, accessToken: String) {
    val now = System.currentTimeMillis()
    prefs(context).edit()
      .putString(KEY_SESSION, sessionId)
      .putLong(KEY_ENGAGED_AT, now)
      .putLong(KEY_EXPIRES_AT, now + MAX_LOCK_LIFETIME_MS)
      .putString(KEY_WEB_URL, webUrl)
      .putString(KEY_ACCESS_TOKEN, accessToken)
      .commit() // commit, not apply: the process may die in the next instant.
  }

  fun clear(context: Context) {
    prefs(context).edit().clear().commit()
  }

  fun read(context: Context): Lock? {
    val p = prefs(context)
    val sessionId = p.getString(KEY_SESSION, null) ?: return null
    val webUrl = p.getString(KEY_WEB_URL, null) ?: return null
    return Lock(
      sessionId = sessionId,
      engagedAt = p.getLong(KEY_ENGAGED_AT, 0L),
      expiresAt = p.getLong(KEY_EXPIRES_AT, 0L),
      webUrl = webUrl,
      accessToken = p.getString(KEY_ACCESS_TOKEN, "") ?: "",
    )
  }

  /**
   * Is a stored lock still worth honouring?
   *
   * The expiry is a backstop against the worst failure: the app dies mid-lock,
   * the server is unreachable so nothing can confirm the session ended, and the
   * user is left with an overlay and no way out. Past the window it is debris.
   */
  fun isLive(lock: Lock?, now: Long = System.currentTimeMillis()): Boolean {
    if (lock == null) return false
    if (lock.sessionId.isEmpty()) return false
    if (lock.expiresAt <= now) return false
    // A clock rolled forward must not manufacture a longer lock than allowed.
    if (lock.engagedAt > now + MAX_LOCK_LIFETIME_MS) return false
    return true
  }
}
