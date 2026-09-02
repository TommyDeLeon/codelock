/**
 * What the shell does when the OS or the user pokes at a locked window.
 *
 * These decisions lived inline in `main.ts`, inside Electron event callbacks a
 * test cannot construct without a running app. Every one is the same shape — an
 * event arrives, and the answer depends only on whether a lock is held — so the
 * answers move here and `main.ts` keeps just the wiring.
 *
 * The point is not that the predicates are hard. It is that each one is a row
 * in docs/ESCAPE-MATRIX.md that was reasoned through and never executed, and
 * that deleting any single `if (locked)` from main.ts would leave a passing
 * test suite and an escapable lock.
 */

/** Every window or OS event the shell reacts to differently while locked. */
export type ShellEvent =
  /** Alt+F4, Ctrl+W, Ctrl+Q, the title-bar close button. */
  | 'close'
  /** Minimise, Show desktop. */
  | 'minimize'
  /** Alt+Tab, the Windows key, anything that steals focus. */
  | 'blur'
  /** A monitor plugged in, unplugged, or rearranged mid-lock. */
  | 'display-change'
  /** Waking from sleep, or returning from the OS lock screen. */
  | 'resume';

/**
 * Does this event have to be undone or re-asserted?
 *
 * Unlocked, every one of these is ordinary desktop behaviour and the shell must
 * keep its hands off: cancelling a close while unlocked would make the app
 * impossible to quit, which is a worse bug than any it prevents.
 */
export function shouldInterceptWhileLocked(event: ShellEvent, locked: boolean): boolean {
  void event;
  return locked;
}

/**
 * Can the close actually be cancelled, or only undone afterwards?
 *
 * Electron's `close` is cancellable via `preventDefault`; `minimize` is not, so
 * that path has to restore the window after the fact instead. Writing it down
 * stops someone folding the two into one handler and quietly losing the
 * restore.
 */
export function isCancellable(event: ShellEvent): boolean {
  return event === 'close';
}

/**
 * Does handling this event need the covers pushed back up too?
 *
 * Whatever stole focus or changed the display layout may have stolen z-order
 * with it, and a cover left behind the thief is a window onto the desktop.
 * Re-focusing without re-asserting covers is the subtle version of this bug:
 * the overlay looks right on the primary monitor while a second screen is wide
 * open.
 */
export function needsCoverReassert(event: ShellEvent): boolean {
  return event === 'blur' || event === 'display-change' || event === 'resume';
}

/**
 * Is re-focusing enough, or must kiosk state be set again from scratch?
 *
 * Kiosk mode and the always-on-top level do not reliably survive a display
 * sleep on Windows: the window comes back focused and no longer on top, which
 * looks fine until another window is raised over it.
 */
export function needsFullReassert(event: ShellEvent): boolean {
  return event === 'display-change' || event === 'resume';
}
