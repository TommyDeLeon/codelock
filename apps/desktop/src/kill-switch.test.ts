import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { HoldToRelease, HOLD_TO_RELEASE_MS } from './kill-switch.js';

/**
 * The escape hatch, under test.
 *
 * This is the most load-bearing behaviour in the product, and not because it
 * is clever. It is the exit that actually gets used — the one recorded
 * abandonment of a session went through it — and it is the only thing standing
 * between a defect elsewhere and a machine its owner cannot get back.
 *
 * So these are invariants rather than ordinary unit tests. Each describes
 * something that must stay true in every build: the hold is ten seconds, it
 * fires once, a stray key does not arm it, and letting go cancels it. If a
 * change makes one of these fail, the change is wrong.
 */

describe('the ten-second escape', () => {
  test('ten seconds is the contract, not an implementation detail', () => {
    // Written down as a test because the number is a promise made in the
    // README, on the lock screen, and in the one place a panicking user will
    // look. Changing it is a product decision, not a refactor.
    assert.equal(HOLD_TO_RELEASE_MS, 10_000);
  });

  test('a full hold releases the screen', () => {
    const hold = new HoldToRelease();
    assert.equal(hold.keyDown('Escape', 0), false, 'must not fire on the first keypress');
    assert.equal(hold.keyDown('Escape', 9_999), false, 'must not fire one millisecond early');
    assert.equal(hold.keyDown('Escape', 10_000), true, 'must fire at exactly ten seconds');
  });

  test('a hold longer than ten seconds still releases', () => {
    // Auto-repeat does not deliver a key event at exactly 10_000ms. The first
    // event past the threshold has to fire, or the hatch opens only for users
    // whose keyboard repeat rate happens to land on the boundary.
    const hold = new HoldToRelease();
    hold.keyDown('Escape', 0);
    assert.equal(hold.keyDown('Escape', 12_500), true);
  });

  test('it fires once, however long the key is held', () => {
    // Auto-repeat sends events for as long as the key is down. A second
    // release would resolve an already-resolved session and record a second
    // failure against a user who pressed Escape once.
    const hold = new HoldToRelease();
    hold.keyDown('Escape', 0);
    assert.equal(hold.keyDown('Escape', 10_000), true);
    assert.equal(hold.keyDown('Escape', 10_100), false);
    assert.equal(hold.keyDown('Escape', 30_000), false);
  });

  test('releasing the key cancels the hold', () => {
    const hold = new HoldToRelease();
    hold.keyDown('Escape', 0);
    hold.keyUp('Escape');
    // The clock restarts from the next press; nine seconds of credit is gone.
    assert.equal(hold.keyDown('Escape', 9_000), false);
    assert.equal(hold.keyDown('Escape', 18_999), false, 'still short of ten from the restart');
    assert.equal(hold.keyDown('Escape', 19_000), true);
  });

  test('another key cancels the hold', () => {
    // Someone typing a solution is not trying to escape. Without this, a hand
    // resting on the keyboard for ten seconds would abandon the session and
    // record a failure the learner never asked for.
    const hold = new HoldToRelease();
    hold.keyDown('Escape', 0);
    hold.keyDown('a', 5_000);
    assert.equal(hold.keyDown('Escape', 10_000), false, 'the earlier hold must not count');
  });

  test('a key that is not Escape never releases the screen', () => {
    const hold = new HoldToRelease();
    for (const key of ['Enter', 'a', 'F4', 'Meta', 'Tab', ' ']) {
      assert.equal(hold.keyDown(key, 0), false);
      assert.equal(hold.keyDown(key, 60_000), false, `${key} must never open the lock`);
    }
  });

  test('progress is honest before, during and after the hold', () => {
    // The ring on the lock screen is the only reason this hatch is
    // discoverable without reading documentation. A progress figure that
    // disagreed with the release would make that countdown a lie.
    const hold = new HoldToRelease();

    const idle = hold.progress(0);
    assert.deepEqual(idle, { holding: false, fraction: 0, msRemaining: 10_000 });

    hold.keyDown('Escape', 1_000);
    const half = hold.progress(6_000);
    assert.equal(half.holding, true);
    assert.equal(half.fraction, 0.5);
    assert.equal(half.msRemaining, 5_000);

    const done = hold.progress(11_000);
    assert.equal(done.fraction, 1);
    assert.equal(done.msRemaining, 0);
  });

  test('progress never exceeds one, however long the key is held', () => {
    const hold = new HoldToRelease();
    hold.keyDown('Escape', 0);
    const overheld = hold.progress(60_000);
    assert.equal(overheld.fraction, 1, 'a fraction above 1 would overflow the ring');
    assert.equal(overheld.msRemaining, 0);
  });

  test('reset returns it to untouched', () => {
    const hold = new HoldToRelease();
    hold.keyDown('Escape', 0);
    hold.keyDown('Escape', 10_000);
    hold.reset();
    assert.deepEqual(hold.progress(10_000), { holding: false, fraction: 0, msRemaining: 10_000 });
    // And it can fire again afterwards: a second session gets its own hatch.
    hold.keyDown('Escape', 20_000);
    assert.equal(hold.keyDown('Escape', 30_000), true);
  });

  test('a shorter hold can be configured, and still behaves', () => {
    // The constructor takes a duration for tests and for any future setting.
    // The default is the contract; the mechanism must not assume the number.
    const hold = new HoldToRelease(2_000);
    assert.equal(hold.keyDown('Escape', 0), false);
    assert.equal(hold.keyDown('Escape', 1_999), false);
    assert.equal(hold.keyDown('Escape', 2_000), true);
  });
});
