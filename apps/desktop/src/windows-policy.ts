/**
 * Will a locally built, unsigned CodeLock.exe actually be allowed to run?
 *
 * On Windows 11, Smart App Control (SAC) is on by default for clean installs
 * and enforces at the *user-mode code integrity* layer — earlier than
 * SmartScreen, and with no prompt to click through. It blocks the process
 * before a single line of main.js executes, so the app does not crash, log,
 * or draw a window. It simply never appears, which is indistinguishable from
 * "the installer worked and then nothing happened".
 *
 * This matters here specifically because electron-builder rewrites the icon
 * and version resources of Electron's own signed `electron.exe` to produce
 * `CodeLock.exe`. That edit invalidates Electron's Authenticode signature, so
 * the shipped binary is unsigned even though the binary it was cut from was
 * not. `docs/TRUSTED-INSTALL.md` Track A does not fix this: a self-signed
 * certificate imported into LocalMachine\Root and TrustedPublisher builds a
 * local trust chain, and SAC does not consult local trust. It wants a
 * Microsoft-reputable signer.
 *
 * Kept as a pure function over the two registry values so the decision is
 * testable without a Windows registry, and so the reasoning lives next to the
 * code rather than in a shell script nobody reads.
 */

/** Verdict for the machine a build was just produced on. */
export interface PolicyVerdict {
  /** True when an unsigned build cannot launch here. */
  blocked: boolean;
  /** One line naming why, safe to print from a build script. */
  reason: string;
}

export interface PolicyProbe {
  /**
   * HKLM\SYSTEM\CurrentControlSet\Control\CI\Policy\VerifiedAndReputablePolicyState.
   * 0 = off, 1 = enforced, 2 = evaluation. Absent on Windows 10 and on
   * installs that have never had Smart App Control.
   */
  verifiedAndReputablePolicyState: number | null;
  /**
   * Win32_DeviceGuard.UsermodeCodeIntegrityPolicyEnforcementStatus.
   * 0 = off, 1 = audit, 2 = enforced. A WDAC policy can block an unsigned
   * binary even where Smart App Control itself is off.
   */
  usermodeCodeIntegrityEnforcement: number | null;
}

const SAC_ENFORCED = 1;
const SAC_EVALUATION = 2;
const UMCI_ENFORCED = 2;

/**
 * Note that evaluation mode is reported as blocking.
 *
 * In evaluation Windows is deciding whether to turn enforcement on, and it
 * flips to enforced without telling anyone. A build that works today and
 * vanishes next week is exactly the failure this is meant to pre-empt, so it
 * is called out now rather than after the switch.
 */
export function evaluatePolicy(probe: PolicyProbe): PolicyVerdict {
  const { verifiedAndReputablePolicyState: sac, usermodeCodeIntegrityEnforcement: umci } = probe;

  if (sac === SAC_ENFORCED) {
    return {
      blocked: true,
      reason:
        'Smart App Control is enforced on this machine. An unsigned CodeLock.exe ' +
        'will be blocked at launch with no error window.',
    };
  }
  if (sac === SAC_EVALUATION) {
    return {
      blocked: true,
      reason:
        'Smart App Control is in evaluation mode and can switch to enforcement ' +
        'without notice. Treat unsigned builds as unrunnable here.',
    };
  }
  if (umci === UMCI_ENFORCED) {
    return {
      blocked: true,
      reason:
        'A WDAC user-mode code integrity policy is enforced on this machine. An ' +
        'unsigned CodeLock.exe needs an explicit allow rule to launch.',
    };
  }
  return { blocked: false, reason: 'No user-mode code integrity policy is enforcing here.' };
}
