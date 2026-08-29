import { describe, expect, it } from 'vitest';
import { evaluatePolicy } from './windows-policy.js';

/**
 * Regression guard for the failure that cost a day: `npm run dist` succeeded,
 * the NSIS installer ran, and the app then never launched — because Windows
 * Smart App Control blocked the unsigned CodeLock.exe before any of its code
 * ran. Nothing in the build output said so, and nothing in the app could,
 * because the app was never allowed to start.
 *
 * The point of these cases is that the build must refuse to be quiet about it.
 */
describe('evaluatePolicy', () => {
  it('blocks when Smart App Control is enforcing', () => {
    const verdict = evaluatePolicy({
      verifiedAndReputablePolicyState: 1,
      usermodeCodeIntegrityEnforcement: 2,
    });
    expect(verdict.blocked).toBe(true);
    expect(verdict.reason).toMatch(/Smart App Control is enforced/);
  });

  it('blocks in evaluation mode too, since it flips without warning', () => {
    const verdict = evaluatePolicy({
      verifiedAndReputablePolicyState: 2,
      usermodeCodeIntegrityEnforcement: 0,
    });
    expect(verdict.blocked).toBe(true);
    expect(verdict.reason).toMatch(/evaluation mode/);
  });

  it('blocks on an enforcing WDAC policy even with Smart App Control off', () => {
    const verdict = evaluatePolicy({
      verifiedAndReputablePolicyState: 0,
      usermodeCodeIntegrityEnforcement: 2,
    });
    expect(verdict.blocked).toBe(true);
    expect(verdict.reason).toMatch(/WDAC/);
  });

  it('allows when Smart App Control is off and nothing else enforces', () => {
    expect(
      evaluatePolicy({
        verifiedAndReputablePolicyState: 0,
        usermodeCodeIntegrityEnforcement: 0,
      }).blocked,
    ).toBe(false);
  });

  // Windows 10, or a machine that never had Smart App Control: the registry
  // value is simply absent. Absence is not enforcement, and must not be
  // reported as a blocked build.
  it('allows when neither value is present', () => {
    expect(
      evaluatePolicy({
        verifiedAndReputablePolicyState: null,
        usermodeCodeIntegrityEnforcement: null,
      }).blocked,
    ).toBe(false);
  });

  it('allows in WDAC audit mode, which logs rather than blocks', () => {
    expect(
      evaluatePolicy({
        verifiedAndReputablePolicyState: 0,
        usermodeCodeIntegrityEnforcement: 1,
      }).blocked,
    ).toBe(false);
  });
});
