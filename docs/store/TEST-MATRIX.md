# Test matrix — CodeLock 1.0.0 Store package

Run 2026-09-19 on Windows 11 Home 10.0.26200, x64, Developer Mode on, Smart
App Control off. The `windows-desktop-e2e` skill excludes Electron from UIA
automation, so each row is a scripted or manual step with the exact command.
Package under test: `apps/desktop/release/CodeLock 1.0.0.appx` from commit
`5c3a820`, unpacked to a loose layout with `makeappx unpack`, registered with
`Add-AppxPackage -Register` (unsigned; a real Store install is Microsoft-signed
and lands in `C:\Program Files\WindowsApps` — that difference is the reason
several rows below are *unverified* rather than *passed*).

Legend: **passed** = observed here · **failed** = observed failing ·
**unverified** = not run here, with the reason and the step to run.

| # | Scenario | Result | Evidence / command |
|---|---|---|---|
| 1 | Clean install + first run | **passed** (Developer-Mode registration) | `Add-AppxPackage -Register <layout>\AppxManifest.xml`; `Start-Process "shell:AppsFolder\tomdeleon.CodeLock_60h9tdzqyk992!CodeLock"`; 4 Electron processes running after 8 s; no crash; tray + window shown. *Store-signed install path unverified* until the listing is live (Phase 5). |
| 2 | A → B upgrade with representative data | **passed** | Registered `1.0.0.0`, launched, stopped; registered a copy with `Version="1.0.1.0"` over it → `PackageFullName tomdeleon.CodeLock_1.0.1.0_x64__60h9tdzqyk992`; `%APPDATA%\CodeLock\config.json` intact; 1.0.1.0 launched from the new layout. Data was the real NSIS profile (settings, session, caches). *Not covered:* a profile living only in `LocalCache` (fresh Store install) — documented in DATA-PATHS.md as kept across upgrades per Microsoft; not observed. |
| 3 | NSIS → Store migration | **passed** | With an NSIS install's `%APPDATA%\CodeLock` present, the packaged app updated `lockfile`, `Preferences`, `Cache\`, `GPUCache\`, `Local Storage\` in place and created nothing under `%LOCALAPPDATA%\Packages\…\LocalCache`. Settings/session/lock state therefore carry over with no code. |
| 4 | Duplicate-instance prevention | **passed** | Second `Start-Process shell:AppsFolder\…!CodeLock` while running: process count stayed 4 → 4. (`app.requestSingleInstanceLock()`.) *Known limit:* an NSIS instance and a Store instance are different identities and can both run — listing tells users to uninstall the direct-download build. |
| 5 | Reboot / start at login | **unverified** | Needs a reboot, which this session does not perform. Step: install, enable *Settings → Apps → Startup → CodeLock* if off, reboot, confirm `Get-Process CodeLock` and a tray icon within 60 s of logon. Open question recorded in CERTIFICATION-NOTES "Known gaps": the startup task passes no `--background`, so the window may show rather than hide. |
| 6 | Lock → solve → unlock, and recovery after kill | **unverified** | Would cover the operator's screen; needs the backend (`docker compose up`) and a solved problem. Steps: `config.json` → `apiUrl`/`webUrl` to the running stack; bake or paste the RS256 public key (`unlockPublicKey`) matching the API's `JWT_UNLOCK_PRIVATE_KEY`; arm a 1-minute timer; when it fires, `Stop-Process -Name CodeLock -Force` → app relaunches and re-covers after server confirm; solve → screen released; check `lock-state.json` cleared. Also hold Escape 10 s → released, session recorded as failed. The RS256 path itself is unit-tested (`unlockSigner.test.ts`, 6/6) and the desktop verifier's claim checks are mirrored there. |
| 7 | Uninstall | **passed** | `Remove-AppxPackage tomdeleon.CodeLock_1.0.0.0_x64__60h9tdzqyk992` → `%LOCALAPPDATA%\Packages\tomdeleon.CodeLock_60h9tdzqyk992` removed; real `%APPDATA%\CodeLock` untouched; no process left. |
| 8 | Build guards (not in the brief, but gate the above) | **passed** | `dist-store.mjs` without identity → exit 1 naming the three variables; bad `CN=` → exit 1; `write-defaults.mjs` with `CODELOCK_BUILD_UNLOCK_SECRET` under `CODELOCK_BUILD_TARGET=store` → exit 1; `dist-store.mjs` after a plain `npm run build` (no key baked) → exit 1. |
| 9 | Windows App Certification Kit | **unverified** | Needs an elevated prompt. Command in RELEASE-GUIDE.md. |
| 10 | arm64 package runs | **unverified** | No arm64 hardware here. Built and manifest-checked only. |

## Direct-download channel regression (dual-channel)

| Check | Result |
|---|---|
| `npm run dist:desktop` still produces `CodeLock Setup 1.0.0.exe` (x64+arm64 NSIS) and `.blockmap` | **passed** (2026-09-19) |
| `node apps/desktop/scripts/check-windows-policy.mjs` | **passed** ("unsigned builds may launch on this machine") |
| electron-updater still initialised for NSIS (`process.windowsStore` undefined) | **passed** by code read (`updater.ts`: only the Store branch returns early); runtime not re-tested |
