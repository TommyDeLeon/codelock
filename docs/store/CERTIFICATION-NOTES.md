# Certification notes — CodeLock 1.0.0 (Microsoft Store)

What the package declares, why, and what to write in Partner Center's "Notes
for certification". Policy numbers refer to Microsoft Store Policies 7.20
(RESEARCH.md §5). Written 2026-09-18 against the package produced by
`npm run dist:store` (manifest verified by unpacking `release/CodeLock 1.0.0.appx`).

## Declared capabilities

| Manifest element | Value | Why it exists | Policy |
|---|---|---|---|
| `<rescap:Capability Name="runFullTrust"/>` | the only capability | CodeLock is an Electron desktop app packaged with the Desktop Bridge; `Windows.FullTrustApplication` is the only entry point Electron supports. It needs full trust for: an always-on-top kiosk window across all displays, a tray icon, global shortcuts to keep focus, reading/writing its own AppData, and outbound HTTP(S) to the user's CodeLock server. It uses no accessibility APIs and no undocumented APIs. | 10.6 (legitimately relates), 10.2.8 (supported methods only) |
| `<desktop:Extension Category="windows.startupTask">` `Enabled="true"` | one startup task | A focus timer that only runs while its window is open is not a timer. The task launches CodeLock at logon so an armed deadline survives a reboot. Windows owns the switch: the user can disable it in Settings → Apps → Startup, and the app has no code path to re-enable it. | 10.2.8 (user control retained) |
| `TargetDeviceFamily Windows.Desktop MinVersion 10.0.18362.0 MaxVersionTested 10.0.26100.0` | Windows 10 1903 → Windows 11 24H2 | Electron 33 supports Windows 10+. 1903 is where packaged apps gained the AppData redirection the NSIS→Store migration relies on (RESEARCH §6). | 10.4.1 |
| Architectures | x64, arm64 (two `.appx`, same version) | Both built by the same command from the same source tree. | — |

Not declared, deliberately: no `internetClient` (not required for full-trust
apps), no file-type associations, no protocol handlers, no background tasks,
no services. The package contains no driver and installs no other software
(10.2.3).

## Behaviours a reviewer will notice, and the honest explanation

**It covers the screen.** When a timer the user armed fires, CodeLock shows a
full-screen, always-on-top window on every display and refuses Alt+F4 /
minimise until the user solves a programming problem graded by their CodeLock
server — or holds Escape for ten seconds, which always works and is recorded
as an abandoned session. This is the product (10.1.1: value proposition is
clear on first run; the dashboard says exactly this before any timer can be
armed). It never engages unless the user armed a timer. It does not and
cannot intercept Ctrl+Alt+Del, Task Manager, sign-out, or power-off (README
"Platform limits"); the listing says so. It is a commitment device, not
parental control, and is not marketed as security software (10.2).

**It relaunches if killed while locked.** `will-quit` re-launches the process
only when a lock is live and was not released by a verified unlock. Ending
the timer via Escape-hold, or quitting from the tray while idle, always
works. Uninstall from Settings → Apps removes the package and its redirected
AppData (10.2.7); the uninstall entry is the standard one Windows shows for
every packaged app — nothing custom.

**It needs a server.** Description begins with the dependency disclosure
required by 10.2.4: "Requires a CodeLock server (self-hosted, free, Docker)
reachable from this PC." Without one the app opens to a dashboard that says
the server is unreachable and refuses to arm a timer; it never locks a
machine it cannot unlock (`main.ts`: `canUnlock` gate). For 10.3.2, the
certification notes must give the tester a reachable server URL or state
that the app is testable without one up to (and excluding) arming a timer —
**owner decision, recorded in TEAM-HANDOFF.md.**

**It runs at startup.** See the startup task row. Launched at logon it stays
in the tray; a lock that was live before the reboot is re-engaged from
`lock-state.json`.

**Updates.** Store only. `electron-updater` is compiled in (shared code with
the direct-download build) but returns immediately when
`process.windowsStore` is true (`src/updater.ts`). The package writes no
`app-update.yml` (`appx.electronUpdaterAware: false`). Store update timing is
not controllable by the app; an update can land while a lock is live and
will apply on next launch, at which point the lock re-engages from disk.

**Data.** Everything the app stores is under its AppData (`config.json`,
`lock-state.json`, `session.enc`, `logs\`), redirected by the package. It
sends submitted code, verdicts and session events to the server the user
configured, over whatever scheme that URL uses — the default is
`http://localhost`, which is loopback; a remote server should be HTTPS
(10.5.4). No telemetry, no analytics, no third-party SDKs. Privacy policy URL:
**blocker B7 until the owner hosts the existing `/privacy` page.**

## Draft "Notes for certification"

> CodeLock is a focus timer for programmers. The user arms a timer; when it
> fires, the app covers the screen until the user solves a coding problem
> graded by the user's own CodeLock server (self-hosted; setup in the README
> linked from the listing). Holding Escape for ten seconds always dismisses
> the lock. Nothing engages unless the user arms a timer.
>
> Testing without a server: install, open — the dashboard reports that no
> server is reachable and the Arm button is disabled. All screens, settings
> and the tray menu are reachable. [OR: A test server is available at
> https://… — owner to fill if one is stood up.]
>
> runFullTrust: Electron desktop app. Startup task: keeps an armed timer alive
> across reboots; user-disableable in Settings > Apps > Startup. No drivers,
> services, or bundled third-party software.

## Known gaps (not certification failures, but true)

- The startup task launches `CodeLock.exe` with no arguments, so the
  `--background` hint the NSIS login item passes is absent; the app may show
  its window at logon instead of staying in the tray. Unverified until the
  Phase 4 reboot test; harmless for certification.
- WACK has not been run in this session (needs an elevated prompt); the
  command is in RELEASE-GUIDE.md.

## Phase 3 behaviour review against the policies (2026-09-19)

Read against `src/main.ts` (`takeScreenFor`, `will-quit`, `classifyStartup`),
`src/updater.ts`, `src/backend.ts`, and the observed Developer-Mode
registration in DATA-PATHS.md.

| Scenario | What the code does | Policy view |
|---|---|---|
| Server unreachable when a timer fires (offline) | `takeScreenFor` asks the server to confirm the lock first; on anything but an explicit refusal it does **not** take the screen and retries every 15 s. The machine stays usable. | 10.2 / 10.4.2: fails open, never traps the user; no crash |
| Server unreachable while locked | The lock stays; the renderer shows the outage banner; Escape-hold (10 s) still releases. | 10.2: documented way out always exists |
| Process killed while locked | `will-quit` relaunches; lock re-engages from `lock-state.json` only after the server re-confirms. | 10.2.8: no OS setting is touched; user can still Ctrl+Alt+Del / sign out |
| Reboot while locked | On next launch the interruption is recorded and the lock re-engages via the same server-confirm path. In a Store install this depends on the startup task being enabled (user-controllable). | 10.2.8 |
| Store pushes an update while locked | Not controllable by the app. The Store replaces the package; on next launch the lock restores from disk as above. Stated plainly in the listing and the release guide. | 10.2.5 (Store-installed, Store-updated) |
| Uninstall while locked | Windows removes the package and its redirected state; nothing can run. The real `%APPDATA%\CodeLock\` from an NSIS install is left, so an NSIS reinstall would restore a still-live lock — acceptable, and the same as today's NSIS behaviour. | 10.2.7: clean uninstall, observed |
| Uninstall while idle | Standard. Observed: package dir removed, no residue in `%LOCALAPPDATA%\Packages\`. | 10.2.7 |
| Two identities at once (NSIS + Store) | Both can run; single-instance lock is per identity. Listing tells users to remove the direct-download version. Not a certification issue. | 10.1.1 (disclosed) |

Migration `20260918120000_learn` (uncommitted, owner's work) was reviewed by
the database reviewer: additive, transaction-safe on Postgres 16, applies
cleanly on empty and migrated databases, no change to any table an existing
desktop client touches. Not modified.

Sanitizer over the unpacked package: PASS. Only the RSA public key is inside
`build-defaults.json`; no private key, secret, `.env`, or developer path.
Source maps were shipping and are now excluded (`electron-builder.yml`).
