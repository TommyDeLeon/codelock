/**
 * The documented way out.
 *
 * Every lock needs one, and pretending otherwise is how you end up with a
 * machine you cannot use and a user who uninstalls the product in anger. The
 * question is only whether the escape is deliberate enough to not be an
 * accident, and visible enough that nobody is ever genuinely trapped.
 *
 * Hold Escape for ten seconds. Long enough that no stray keypress does it,
 * short enough to be usable in a panic, and the lock screen counts down on
 * screen the whole time so it is discoverable without reading the docs.
 *
 * Using it is not free: it resolves the session as ABANDONED on the server,
 * which counts as a failure for adaptive difficulty. That is the point — the
 * exit exists, it just is not the cheap path.
 *
 * Deliberately a pure state machine with no timers and no Electron imports, so
 * the thing that decides whether the machine opens is testable.
 */

export const HOLD_TO_RELEASE_MS = 10_000;

export interface HoldProgress {
  holding: boolean;
  /** 0..1. Drives the on-screen ring; 1 means it has fired. */
  fraction: number;
  msRemaining: number;
}

export class HoldToRelease {
  #startedAt: number | null = null;
  #fired = false;

  constructor(private readonly holdMs: number = HOLD_TO_RELEASE_MS) {}

  /**
   * A key went down. Returns true the moment the hold completes — once only,
   * so auto-repeat cannot fire the release twice.
   */
  keyDown(key: string, now: number): boolean {
    if (key !== 'Escape') {
      // Any other key means the user is doing something else. Treating this as
      // a reset stops "leaning on the keyboard" from counting as intent.
      this.reset();
      return false;
    }

    this.#startedAt ??= now;

    if (!this.#fired && now - this.#startedAt >= this.holdMs) {
      this.#fired = true;
      return true;
    }
    return false;
  }

  keyUp(key: string): void {
    if (key === 'Escape') this.reset();
  }

  progress(now: number): HoldProgress {
    if (this.#startedAt === null) return { holding: false, fraction: 0, msRemaining: this.holdMs };
    const elapsed = now - this.#startedAt;
    const fraction = Math.min(1, elapsed / this.holdMs);
    return { holding: true, fraction, msRemaining: Math.max(0, this.holdMs - elapsed) };
  }

  reset(): void {
    this.#startedAt = null;
    this.#fired = false;
  }
}
