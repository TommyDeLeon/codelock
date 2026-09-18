# Where CodeLock keeps its data — NSIS vs Store

Observed 2026-09-19 on Windows 11 10.0.26200 by registering the unsigned
`CodeLock 1.0.0.appx` layout in Developer Mode (`Add-AppxPackage -Register`),
launching it, and removing it (`Remove-AppxPackage`). Rows marked *documented*
come from Microsoft's page in RESEARCH.md §6 and were not observed here.

## What the app writes

All through Electron's `app.getPath('userData')` after `app.setName('CodeLock')`,
except the launcher log directory:

| File | Written by | Purpose |
|---|---|---|
| `config.json` | `src/config.ts` | webUrl, apiUrl, unlock key, backendCommand; created on first run |
| `lock-state.json` | `src/lock-state.ts` | the lock, so a crash/kill does not unlock |
| `session.enc` | `src/session-store.ts` | encrypted session material |
| `Preferences`, `Cache\`, `GPUCache\`, `Local Storage\`, `lockfile`, … | Electron/Chromium | renderer state |
| `%LOCALAPPDATA%\CodeLock\logs\backend-status.json` | `scripts/serve-local.ps1` (self-host only) | why the backend is down |

## Paths by install type

| | NSIS (direct download) | Microsoft Store package |
|---|---|---|
| Install dir | `%LOCALAPPDATA%\Programs\CodeLock\` (per-user NSIS) | `C:\Program Files\WindowsApps\tomdeleon.CodeLock_1.0.0.0_x64__60h9tdzqyk992\` — read-only, OS-locked |
| Package family name | — | `tomdeleon.CodeLock_60h9tdzqyk992` (observed; the hash is derived from the Publisher and is stable across versions) |
| `userData` as Electron sees it | `%APPDATA%\CodeLock\` | `%APPDATA%\CodeLock\` — same string; the OS redirects underneath |
| Where a **fresh** install's files land | `%APPDATA%\CodeLock\` | *documented*: `%LOCALAPPDATA%\Packages\tomdeleon.CodeLock_60h9tdzqyk992\LocalCache\Roaming\CodeLock\` (new files under Roaming are redirected per-package). Not observed: this machine already had an NSIS profile and the audit did not move it. |
| Where files land when `%APPDATA%\CodeLock\` **already exists** | same | **observed**: the real `%APPDATA%\CodeLock\` — `lockfile`, `Preferences`, `Cache\`, `GPUCache\`, `Local Storage\` were all updated in place; `LocalCache\` stayed empty. |
| Logs dir | `%LOCALAPPDATA%\CodeLock\logs\` | *documented*: redirected to `…\LocalCache\Local\CodeLock\logs\` on a fresh profile; in place if it already exists |
| Startup registration | `HKCU\…\Run` via `app.setLoginItemSettings` | `windows.startupTask` in the manifest; `setAutoStart` is a no-op (`src/background.ts`) |
| Uninstall removes | install dir only (NSIS leaves `%APPDATA%\CodeLock`) | **observed**: `…\Packages\tomdeleon.CodeLock_60h9tdzqyk992\` deleted; the real `%APPDATA%\CodeLock\` left intact |

## Migration consequences

**NSIS → Store on the same machine (the dual-channel case).** Install the Store
package without uninstalling NSIS first, or after — either way the Store build
opens the existing `%APPDATA%\CodeLock\config.json`, `lock-state.json` and
`session.enc` in place (observed for Electron's own files; the same OS rule
applies to any pre-existing file in that directory). Settings, progress cache,
auth session and a live lock all carry over with no code. Two things to know:

- Both installs share the profile. Running both at once is prevented by
  `app.requestSingleInstanceLock()` only within one package identity; an NSIS
  instance and a Store instance are different identities and would both start.
  The Store listing tells the user to uninstall the direct-download version.
- Uninstalling the Store package later does **not** remove the shared profile
  (observed), so a user going back to NSIS loses nothing.

**Store A → Store B (upgrade).** Same package family, same redirected
location; Microsoft documents that redirected writes are kept across package
upgrades and deleted only on removal (RESEARCH §6). Not yet observed — Phase 4
matrix.

**Fresh Store install, later NSIS.** The NSIS build writes to the real
`%APPDATA%\CodeLock\`, which is empty; the Store profile stays in
`LocalCache\Roaming\CodeLock\`. They diverge. Documented, not solved: it is the
uncommon direction.

## Backing up / removing everything (for the listing's "Data" section)

Self-hosted data lives in the user's own Postgres (README "Data and removal").
On the PC: delete `%APPDATA%\CodeLock\` and, for a Store install,
`%LOCALAPPDATA%\Packages\tomdeleon.CodeLock_60h9tdzqyk992\` (uninstalling the
package does the latter automatically).
