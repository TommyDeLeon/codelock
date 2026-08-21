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
| D7 | Windows key / Show desktop | `UNTESTED` | Same as D6. The taskbar is suppressed by kiosk mode. |
| D8 | Switch virtual desktop | `UNTESTED` | `setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })`. |
| D9 | Second monitor | `UNTESTED` | Opaque cover windows at `screen-saver` level on every non-lock display. |
| D10 | Plug in a monitor mid-lock | `UNTESTED` | `display-added` re-syncs covers. |
| D11 | Unplug the lock screen's monitor | `UNTESTED` | `display-removed` re-syncs; the lock window is moved by the OS onto a surviving display and its cover is dropped. |
| D12 | Sleep and wake | `UNTESTED` | `powerMonitor.resume` re-asserts kiosk, always-on-top level, and covers. |
| D13 | Lock the OS session and return | `UNTESTED` | `powerMonitor.unlock-screen`, same handler. |
| D14 | DevTools (F12, Ctrl+Shift+I) | `UNTESTED` | Swallowed shortcuts, and `devTools: false` in packaged builds. |
| D15 | Kill the process (Task Manager → End Task) | `UNTESTED` | Lock state is on disk. `will-quit` calls `app.relaunch()` while a lock is live and no verified release happened. |
| D16 | Kill the process, then delete `%APPDATA%/CodeLock/lock-state.json` | **`DEFEATED`** | By design. A deliberate two-step act with a file manager is above the bar a commitment device is trying to set. |
| D17 | Reboot the machine | `UNTESTED` | The lock file survives, but nothing launches CodeLock at login yet. **This is a real gap** — see below. |
| D18 | Ctrl+Alt+Del → Sign out / Task Manager | **`DEFEATED`** | The Secure Attention Sequence cannot be intercepted by any userland process on Windows. Stated in the product copy. |
| D19 | Hard power-off | **`DEFEATED`** | Nothing in userland prevents this. Combined with D17 it is currently a full escape. |
| D20 | Boot another OS / safe mode | **`DEFEATED`** | Out of scope for any userland app. |
| D21 | Hold Escape for 10s | **`DEFEATED` (intended)** | The documented kill switch. Resolves the session as `ABANDONED`, which counts as a failure for adaptive difficulty. |
| D22 | Patch the renderer / call `codelock.unlock('')` from a console | `UNTESTED` | The token is verified in the main process against a key the renderer cannot read. A forged or absent token fails signature verification and the overlay stays. |

### Known gap: D17 + D19

Rebooting currently escapes, because nothing registers CodeLock as a login item
and the relaunch in `will-quit` does not survive a power cut. The lock file is
still on disk and will be honoured the next time the app starts by hand, but
"the next time the app starts by hand" is the user's choice.

Closing this needs a login-item registration (`app.setLoginItemSettings` on
Windows and macOS, a `.desktop` autostart entry on Linux). It is deliberately
**not** done yet: an app that silently adds itself to startup and then covers
the screen on boot is one bad state away from bricking a machine, and the
relaunch loop in D15 needs hardware testing before it is wired to boot.

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
