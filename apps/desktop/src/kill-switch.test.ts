import { describe, expect, it } from 'vitest';
import { HoldToRelease } from './kill-switch.js';

/**
 * This decides whether the machine opens. It is worth over-testing.
 */
describe('HoldToRelease', () => {
  const t0 = 1_000_000;

  it('does not fire on a tap', () => {
    const hold = new HoldToRelease(10_000);
    expect(hold.keyDown('Escape', t0)).toBe(false);
    hold.keyUp('Escape');
    expect(hold.keyDown('Escape', t0 + 20_000)).toBe(false);
  });

  it('fires once the hold completes', () => {
    const hold = new HoldToRelease(10_000);
    expect(hold.keyDown('Escape', t0)).toBe(false);
    expect(hold.keyDown('Escape', t0 + 5_000)).toBe(false);
    expect(hold.keyDown('Escape', t0 + 10_000)).toBe(true);
  });

  it('fires exactly once, not on every auto-repeat after', () => {
    const hold = new HoldToRelease(10_000);
    hold.keyDown('Escape', t0);
    expect(hold.keyDown('Escape', t0 + 10_000)).toBe(true);
    expect(hold.keyDown('Escape', t0 + 10_030)).toBe(false);
    expect(hold.keyDown('Escape', t0 + 12_000)).toBe(false);
  });

  it('resets when Escape is released', () => {
    const hold = new HoldToRelease(10_000);
    hold.keyDown('Escape', t0);
    hold.keyDown('Escape', t0 + 9_000);
    hold.keyUp('Escape');
    // The clock restarts; nine seconds of credit is not carried over.
    expect(hold.keyDown('Escape', t0 + 9_500)).toBe(false);
    expect(hold.keyDown('Escape', t0 + 19_400)).toBe(false);
    expect(hold.keyDown('Escape', t0 + 19_500)).toBe(true);
  });

  it('resets when any other key is pressed', () => {
    const hold = new HoldToRelease(10_000);
    hold.keyDown('Escape', t0);
    hold.keyDown('a', t0 + 5_000);
    expect(hold.keyDown('Escape', t0 + 10_100)).toBe(false);
  });

  it('reports progress for the on-screen countdown', () => {
    const hold = new HoldToRelease(10_000);
    expect(hold.progress(t0)).toEqual({ holding: false, fraction: 0, msRemaining: 10_000 });

    hold.keyDown('Escape', t0);
    expect(hold.progress(t0 + 5_000)).toEqual({
      holding: true,
      fraction: 0.5,
      msRemaining: 5_000,
    });

    hold.keyDown('Escape', t0 + 10_000);
    expect(hold.progress(t0 + 12_000)).toEqual({
      holding: true,
      fraction: 1,
      msRemaining: 0,
    });
  });
});
