import { describe, expect, it } from 'vitest';
import {
  isCancellable,
  needsCoverReassert,
  needsFullReassert,
  shouldInterceptWhileLocked,
  type ShellEvent,
} from './lock-guards.js';

/**
 * The escape-matrix rows that were reasoned through and never executed.
 *
 * These do not prove the lock holds on real hardware — only a person at the
 * machine can do that, and the matrix still says so. What they prove is the
 * narrower thing that kept regressing: that the shell has an opinion about each
 * of these events at all, and that the opinion is conditioned on the lock
 * rather than applied unconditionally.
 */
const EVENTS: ShellEvent[] = ['close', 'minimize', 'blur', 'display-change', 'resume'];

describe('what the shell intercepts while locked', () => {
  it.each(EVENTS)('intercepts %s when a lock is held', (event) => {
    expect(shouldInterceptWhileLocked(event, true)).toBe(true);
  });

  /**
   * The half that is easy to lose.
   *
   * A guard that fires unconditionally passes every "does it hold the lock"
   * test and makes the app impossible to quit, minimise, or move between
   * monitors when nothing is locked at all.
   */
  it.each(EVENTS)('leaves %s alone when nothing is locked', (event) => {
    expect(shouldInterceptWhileLocked(event, false)).toBe(false);
  });
});

describe('how each event has to be handled', () => {
  // Electron only lets `close` be vetoed. A minimise has already happened by
  // the time the event arrives, so it must be undone rather than prevented.
  it('cancels a close but can only undo a minimise', () => {
    expect(isCancellable('close')).toBe(true);
    expect(isCancellable('minimize')).toBe(false);
  });

  it('pushes the covers back up whenever z-order could have moved', () => {
    expect(needsCoverReassert('blur')).toBe(true);
    expect(needsCoverReassert('display-change')).toBe(true);
    expect(needsCoverReassert('resume')).toBe(true);
  });

  // Cancelling a close never disturbs the covers, so re-asserting them there
  // would be churn on the hot path — every Alt+F4 mash would trigger it.
  it('does not disturb the covers for close or minimise', () => {
    expect(needsCoverReassert('close')).toBe(false);
    expect(needsCoverReassert('minimize')).toBe(false);
  });

  /**
   * Waking and display changes need kiosk state set again, not just focus.
   *
   * Focus alone is the plausible-looking fix: the window comes back in front
   * and looks correct, while `setKiosk` and the always-on-top level have been
   * dropped by the display sleep, so the next window raised covers it.
   */
  it('re-asserts kiosk state after a resume or a display change', () => {
    expect(needsFullReassert('resume')).toBe(true);
    expect(needsFullReassert('display-change')).toBe(true);
    expect(needsFullReassert('blur')).toBe(false);
  });
});
