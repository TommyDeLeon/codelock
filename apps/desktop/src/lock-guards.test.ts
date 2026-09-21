import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { verdictFor, type ActiveSessionReply } from './lock-watchdog.js';
import {
  isCancellable,
  needsCoverReassert,
  needsFullReassert,
  shouldInterceptWhileLocked,
  type ShellEvent,
} from './lock-guards.js';

/**
 * The two rules that decide whether the screen stays held.
 *
 * The watchdog is the safety net for endings that carry no unlock token — a
 * spent skip, a give-up from another device, the twelve-hour reaper. It fails
 * *closed*, deliberately: if an unreachable server released the screen, then
 * unplugging the network would be the quietest bypass in the product, quieter
 * than Task Manager and available to anyone. Quitting Docker Desktop would be
 * another. That is why an outage does not auto-release — the ten-second escape
 * is the anti-trap mechanism, and it costs a failed session.
 *
 * The guards are the other half: which shell events must be undone while
 * locked, and which must be left alone while unlocked.
 */

const HELD = 'a0000000-0000-4000-8000-000000000001';
const OTHER = 'b0000000-0000-4000-8000-000000000002';

const reply = (session: ActiveSessionReply['session']): ActiveSessionReply => ({ session });

describe('the watchdog fails closed', () => {
  test('an unreachable server never releases the screen', () => {
    // The bypass this prevents: pull the network cable, or stop the API, and
    // walk away from the lock. Every other rule here is downstream of this one.
    assert.deepEqual(verdictFor(null, HELD), { release: false, reason: 'unreachable' });
  });

  test('a server that still reports this session LOCKED holds the screen', () => {
    const verdict = verdictFor(reply({ id: HELD, state: 'LOCKED' }), HELD);
    assert.deepEqual(verdict, { release: false, reason: 'still-locked' });
  });

  test('no active session at all means this lock has ended', () => {
    // The ending with no token to show for it: resolved elsewhere, reaped, or
    // given up on from another device.
    assert.deepEqual(verdictFor(reply(null), HELD), { release: true, reason: 'resolved' });
  });

  test('a different active session means this lock has ended', () => {
    // Exactly what an auto re-arm looks like the instant after a skip: there
    // is a session, but it is not the one this process is holding.
    assert.deepEqual(verdictFor(reply({ id: OTHER, state: 'LOCKED' }), HELD), {
      release: true,
      reason: 'resolved',
    });
  });

  test('this session in any state other than LOCKED means it has ended', () => {
    for (const state of ['UNLOCKED', 'BYPASSED', 'ABANDONED', 'ARMED']) {
      assert.deepEqual(
        verdictFor(reply({ id: HELD, state }), HELD),
        { release: true, reason: 'resolved' },
        `state ${state} should release`,
      );
    }
  });

  test('holding no server session concludes nothing', () => {
    // A restored lock file, or the manual path: there is no session to ask
    // about, so the watchdog must not decide anything either way.
    assert.deepEqual(verdictFor(reply(null), null), { release: false, reason: 'still-locked' });
    assert.deepEqual(verdictFor(reply({ id: HELD, state: 'LOCKED' }), null), {
      release: false,
      reason: 'still-locked',
    });
  });

  test('a reply whose session is not this one releases, including malformed ids', () => {
    // Documented rather than defended: an id of the wrong type is treated as
    // "not this session", which releases. That is only safe because a real API
    // cannot produce it. If this ever fires in the wild the fix is to make the
    // reply shape strict — never to loosen the unreachable rule above.
    const nonsense = { session: { id: 42, state: 'LOCKED' } } as unknown as ActiveSessionReply;
    assert.equal(verdictFor(nonsense, HELD).release, true);
  });
});

describe('what the shell does with events while locked', () => {
  const events: ShellEvent[] = ['close', 'minimize', 'blur', 'display-change', 'resume'];

  test('every event is intercepted while locked', () => {
    for (const event of events) {
      assert.equal(shouldInterceptWhileLocked(event, true), true, `${event} while locked`);
    }
  });

  test('no event is intercepted while unlocked', () => {
    // Cancelling a close while unlocked makes the app impossible to quit,
    // which is a worse bug than any it would prevent.
    for (const event of events) {
      assert.equal(shouldInterceptWhileLocked(event, false), false, `${event} while unlocked`);
    }
  });

  test('only close can be cancelled outright', () => {
    // Electron's minimize is not cancellable, so that path has to restore the
    // window afterwards instead. Folding the two together loses the restore.
    assert.equal(isCancellable('close'), true);
    for (const event of events.filter((e) => e !== 'close')) {
      assert.equal(isCancellable(event), false, `${event} is not cancellable`);
    }
  });

  test('anything that could steal z-order re-asserts the covers', () => {
    // A cover left behind the thief is a window onto the desktop — and the
    // subtle version is a correct-looking primary monitor beside a second
    // screen that is wide open.
    assert.equal(needsCoverReassert('blur'), true);
    assert.equal(needsCoverReassert('display-change'), true);
    assert.equal(needsCoverReassert('resume'), true);
    assert.equal(needsCoverReassert('close'), false);
    assert.equal(needsCoverReassert('minimize'), false);
  });

  test('display changes and wake re-assert kiosk state from scratch', () => {
    // Kiosk mode and the always-on-top level do not reliably survive a display
    // sleep on Windows: the window returns focused and no longer on top, which
    // looks right until something else is raised over it.
    assert.equal(needsFullReassert('display-change'), true);
    assert.equal(needsFullReassert('resume'), true);
    assert.equal(needsFullReassert('blur'), false, 'a blur only needs focus and covers');
    assert.equal(needsFullReassert('close'), false);
    assert.equal(needsFullReassert('minimize'), false);
  });

  test('a full re-assert always implies the covers too', () => {
    // Re-focusing without re-asserting covers is the bug this pairing exists
    // to prevent, so the stronger action must never be the weaker one's gap.
    for (const event of events) {
      if (needsFullReassert(event)) {
        assert.equal(needsCoverReassert(event), true, `${event} must also re-assert covers`);
      }
    }
  });
});
