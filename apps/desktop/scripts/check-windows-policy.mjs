/**
 * Say out loud when the build that just finished cannot run on this machine.
 *
 * `npm run dist` produces an unsigned CodeLock.exe, because electron-builder
 * rewrites the icon and version resources of Electron's signed binary and
 * nothing re-signs the result. On a Windows 11 machine with Smart App Control
 * enforcing, that executable — and the NSIS installer around it — is blocked
 * at load time by user-mode code integrity. There is no crash, no dialog and
 * no log: the install appears to succeed and the app simply never opens.
 *
 * The build cannot fix that, and must not try — turning off a machine's
 * execution-control policy is not a build step. What it can do is refuse to
 * hand over an installer while implying it will work. This runs last so the
 * warning is the final thing on screen, and it never fails the build: a build
 * made here for a differently-configured machine is perfectly valid.
 *
 * Windows only. Everywhere else it exits quietly.
 */
import { execFileSync } from 'node:child_process';

if (process.platform !== 'win32') process.exit(0);

// Loaded dynamically, and forgiven if absent. This runs at the very end of a
// successful `npm run dist`, so a throw here would report a failed build for
// one that in fact produced a perfectly good installer. An advisory notice is
// never worth that.
let evaluatePolicy;
try {
  ({ evaluatePolicy } = await import('../dist/windows-policy.js'));
} catch {
  process.exit(0);
}

/** Both values in one PowerShell round trip; absent keys come back as null. */
const PROBE = `
$sac = $null
try {
  $sac = (Get-ItemProperty 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\CI\\Policy' -Name VerifiedAndReputablePolicyState -ErrorAction Stop).VerifiedAndReputablePolicyState
} catch {}
$umci = $null
try {
  $umci = (Get-CimInstance -ClassName Win32_DeviceGuard -Namespace root\\Microsoft\\Windows\\DeviceGuard -ErrorAction Stop).UsermodeCodeIntegrityPolicyEnforcementStatus
} catch {}
[pscustomobject]@{
  verifiedAndReputablePolicyState = $sac
  usermodeCodeIntegrityEnforcement = $umci
} | ConvertTo-Json -Compress
`;

function numberOrNull(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function probe() {
  try {
    const out = execFileSync(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-Command', PROBE],
      { encoding: 'utf8', timeout: 30_000 },
    );
    const parsed = JSON.parse(out.trim());
    return {
      verifiedAndReputablePolicyState: numberOrNull(parsed.verifiedAndReputablePolicyState),
      usermodeCodeIntegrityEnforcement: numberOrNull(parsed.usermodeCodeIntegrityEnforcement),
    };
  } catch {
    // A locked-down or unusual host that will not answer is not evidence of
    // enforcement. Stay quiet rather than crying wolf after a good build.
    return null;
  }
}

const readings = probe();
if (!readings) process.exit(0);

const verdict = evaluatePolicy(readings);
if (!verdict.blocked) {
  console.log('windows policy: unsigned builds may launch on this machine.');
  process.exit(0);
}

console.warn(
  [
    '',
    '  +- THIS INSTALLER WILL NOT LAUNCH ON THIS MACHINE --------------------',
    `  | ${verdict.reason}`,
    '  |',
    '  | The installer will appear to succeed while writing nothing, and',
    '  | the app will never open. Windows blocks it before any CodeLock',
    '  | code runs, so the app logs stay empty. Check what got installed:',
    '  |',
    '  |   Test-Path "$env:LOCALAPPDATA\\Programs\\CodeLock\\CodeLock.exe"',
    '  |   Get-WinEvent -LogName Microsoft-Windows-CodeIntegrity/Operational |',
    '  |     Where-Object Message -match CodeLock | Select-Object -First 3',
    '  |',
    '  | To develop here, skip the installer and run the unpacked build:',
    '  |',
    '  |   npx electron-builder --win nsis --x64 --arm64 \\',
    '  |     -c.win.signAndEditExecutable=false --publish never',
    '  |   .\\release\\win-unpacked\\CodeLock.exe',
    '  |',
    '  | Installing needs a trusted signature, not a code change. See',
    '  | docs/TRUSTED-INSTALL.md, "Check Smart App Control first".',
    '  +---------------------------------------------------------------------',
    '',
  ].join('\n'),
);
