# Escape matrix

Every way we could think of to get past a live CodeLock lock, per platform,
with what actually happens.

The point of this file is that the product copy must never claim more than this
table. If an escape works, it is listed as working.

**Status key** — `HELD` the lock survived · `DEFEATED` the escape worked ·
`UNTESTED` written but not exercised on hardware.

Last run: 22 August 2026.

---

## Desktop — Electron

Tested on Windows 11 unless noted. macOS and Linux rows are `UNTESTED`: no
hardware available at the time of writing.

| # | Attempt | Result | Notes |
|---|---|---|---|
| D1 | Alt+F4 | `UNTESTED` | Registered as a swallowed global shortcut while locked, and `window.on('close')` cancels the event regardless. |
| D2 | Ctrl+W / Cmd+W | `UNTESTED` | Same two barriers. |
| D3 | Ctrl+Q / Cmd+Q | `UNTESTED` | Swallowed shortcut plus `before-quit` cancelling the quit. |
| D4 | Click the window close button | `UNTESTED` | `setClosable(false)`, and `close` is cancelled. |
| D5 | Minimise | `UNTESTED` | `setMinimizable(false)`; `minimize` is not cancellable, so it is undone in the handler. |
| D6 | Alt+Tab to another window | `UNTESTED` | Cannot be intercepted from userland. Kiosk mode plus `blur` → `focus()` pulls the lock back in front. |
| D7 | Windows key / Show desktop | `HOLDS` | **Partially tested 30 Aug 2026.** `ShowWindow(SW_MINIMIZE)` — the programmatic form of Show desktop — was called on the lock window: it did not stay minimised (`IsIconic` false 1.5s later) and the shell still reported `locked: true`. The `minimize` handler restores and refocuses. The keystrokes themselves were not pressed by hand, so this covers the effect and not the input path. |
| D8 | Switch virtual desktop | `UNTESTED` | `setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })`. |
| D9 | Second monitor | `UNTESTED` | Opaque cover windows at `screen-saver` level on every non-lock display. |
| D10 | Plug in a monitor mid-lock | `UNTESTED` | `display-added` re-syncs covers. |
| D11 | Unplug the lock screen's monitor | `UNTESTED` | `display-removed` re-syncs; the lock window is moved by the OS onto a surviving display and its cover is dropped. |
| D12 | Sleep and wake | `UNTESTED` | `powerMonitor.resume` re-asserts kiosk, always-on-top level, and covers. |
| D13 | Lock the OS session and return | `UNTESTED` | `powerMonitor.unlock-screen`, same handler. |
| D14 | DevTools (F12, Ctrl+Shift+I) | `UNTESTED` | Swallowed shortcuts, and `devTools: false` in packaged builds. |
| D15 | Kill the process (Task Manager → End Task) | **`DEFEATED`** | **Tested 30 Aug 2026.** `Stop-Process -Force` took all four processes to zero and nothing came back: the relaunch lives in `will-quit`, which a hard kill never runs. The overlay is gone until the app is started again. `lock-state.json` does survive, and a later launch restores the lock (see D15b) — but "later" is the user's choice. |
| D15b | Relaunch after killing it while locked | `HOLDS` | **Tested 30 Aug 2026.** Starting the app again after D15 restored the lock from `lock-state.json`: the shell reported `locked: true` without any new timer. This is what limits D15 to a temporary escape on a machine where the login item is registered. |
| D16 | Kill the process, then delete `%APPDATA%/CodeLock/lock-state.json` | **`DEFEATED`** | By design. A deliberate two-step act with a file manager is above the bar a commitment device is trying to set. |
| D17 | Reboot the machine | `UNTESTED` | The lock file survives, and a packaged build now registers a login item on first run and re-engages a live lock on start. Not yet watched through a real reboot — see below. |
| D18 | Ctrl+Alt+Del → Sign out / Task Manager | **`DEFEATED`** | The Secure Attention Sequence cannot be intercepted by any userland process on Windows. Stated in the product copy. |
| D19 | Hard power-off | **`DEFEATED`** | Nothing in userland prevents this. Combined with D17 it is currently a full escape. |
| D20 | Boot another OS / safe mode | **`DEFEATED`** | Out of scope for any userland app. |
| D21 | Hold Escape for 10s | **`DEFEATED` (intended)** | The documented kill switch. Resolves the session as `ABANDONED`, which counts as a failure for adaptive difficulty. |
| D23 | Replay a *real* unlock token earned on an earlier lock | `HOLDS` | **Was a genuine bypass until 2 Sep 2026.** D22 covers a forged token; this is its opposite — a correctly signed token the user really earned, kept, and presented against a *different* lock inside its five-minute lifetime. Signature verification passes, because the token is authentic. The handler then released the lock without ever comparing the token's `sid` claim against the session being held, so one solved problem opened every lock in that window and the second unlock cost nothing. Now `unlockTokenOpensLock()` requires the claim to match the held session; regression tests live in `lock-state.test.ts`. |
| D22 | Patch the renderer / call `codelock.unlock('')` from a console | `HOLDS` | **Tested 30 Aug 2026.** Called over the debug protocol against a live lock: `unlock('not.a.token')` and `unlock('')` both returned `{ok: false, reason: 'malformed'}` and the overlay stayed. The token is verified in the main process against a key the renderer cannot read. |

### Known gap: D17 + D19

The login item this section used to call for now exists. `setAutoStart(true)`
runs on `ready` in packaged builds only, registering the app with
`app.setLoginItemSettings` and `--background`, and a lock still live in
`lock-state.json` is re-engaged once the window is ready. The registration has
been confirmed on Windows: the `Run` key points at the installed executable.

What has **not** happened is anyone sitting through a real reboot and watching
the overlay come back, so D17 stays `UNTESTED` rather than moving to `HOLDS`.
The caution that kept this closed still applies to the verdict: an app that
adds itself to startup and then covers the screen on boot is one bad state away
from an unusable machine, and this row should only be promoted after a reboot
has been observed on hardware — including the case where the backend is not yet
up, since an overlay whose API is unreachable cannot be solved out of.

D19 is unchanged and is still a full escape on its own: nothing in userland
survives a hard power-off, and the relaunch in `will-quit` does not run.

---

## Android

`UNTESTED` throughout: the native module is written but has never been
compiled. No JDK or Android SDK on the development machine, and no EAS build
has been run. Every row below is a claim about code, not an observation.

| # | Attempt | Result | Notes |
|---|---|---|---|
| A1 | Back button | `UNTESTED` | Swallowed in `dispatchKeyEvent` on the overlay container, and by `BackHandler` in the in-app screen. |
| A2 | Home button | `UNTESTED` | Cannot be intercepted. The `TYPE_APPLICATION_OVERLAY` window stays on top of the launcher. |
| A3 | Recents → swipe the app away | `UNTESTED` | Kills the activity, not the foreground service. The overlay is owned by the service. |
| A4 | Open another app | `UNTESTED` | Overlay stays above it. |
| A5 | Pull down the status bar | **`DEFEATED`** | System UI always draws above application overlays. The user can reach Settings from there. |
| A6 | Reboot | `UNTESTED` | `BootReceiver` on `BOOT_COMPLETED` re-engages from `SharedPreferences`. |
| A7 | Update the app | `UNTESTED` | `MY_PACKAGE_REPLACED` handled in the same receiver. |
| A8 | Low-memory kill | `UNTESTED` | `START_STICKY` plus recovery from stored state on a null-intent restart. |
| A9 | Settings → Force stop | **`DEFEATED`** | Documented. Nothing short of Device Owner provisioning prevents it. |
| A10 | Safe Mode | **`DEFEATED`** | Third-party apps do not run. |
| A11 | Uninstall / Clear data | **`DEFEATED`** | Clears the persisted lock. |
| A12 | OEM battery manager kills the service | **`DEFEATED` unless exempted** | Xiaomi, Huawei, Samsung and OnePlus. The app offers the exemption settings screen after the overlay permission is granted. |
| A13 | Revoke "Display over other apps" mid-lock | `UNTESTED` | Android tears the window down. The lock is still live server-side, so the in-app soft lock persists, but the overlay is gone until the permission returns. |

### Permission prompts the user must accept

1. **Notifications** — runtime dialog, on first sign-in.
2. **Display over other apps** — *not* a dialog. Android only grants it from
   Settings → Apps → Special app access → Display over other apps. The app
   explains why before sending the user there.
3. **Battery optimisation exemption** — Settings screen, offered after 2.

Expo Go cannot host any of this; it needs a development or production build.

---

## iOS

| # | Attempt | Result | Notes |
|---|---|---|---|
| I1 | Anything at all | **`DEFEATED`** | No public API lets one app block another. This is a platform decision, not a gap in this code. |

The native module reports `isSupported: false` and every enforcement call
returns false, so the UI renders the soft lock — CodeLock owns its own screen
and notifies — and never implies otherwise.

The only sanctioned alternative is the `FamilyControls` / `ManagedSettings`
entitlement with a `DeviceActivityMonitor` extension. It is request-gated,
granted case by case, and scoped to parental-control products. Not attempted.

---

## Browser

| # | Attempt | Result |
|---|---|---|
| B1 | Close the tab | **`DEFEATED`** |

A tab can always be closed. `beforeunload` produces a confirmation dialog and
nothing more. This is why the web app is being re-scoped to marketing and a
demo, and is not a lock surface.

---

## The honest summary

CodeLock is a commitment device, not a parental control. On every platform
there is a deliberate, conscious act that ends the lock — Ctrl+Alt+Del,
force-stop, closing a tab, or holding Escape for ten seconds. The design goal
is that none of them happens by accident or by reflex, and that the cheap
escapes cost you a recorded failure.
