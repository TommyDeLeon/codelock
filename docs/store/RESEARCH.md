# Microsoft Store research — CodeLock desktop

Checked 2026-09-18. Every row is a claim, the primary source, the date the page
reported (`ms.date` / `updated_at`), and a confidence grade:

- **A** — read on the primary Microsoft or electron-builder page, or verified by
  reading code/binaries on this machine.
- **B** — Microsoft Q&A / secondary page, or a primary page read through a
  summarising fetch rather than in full.
- **U** — unverified: could not be run or read here. Never inferred.

Method note: the `deep-research` skill's firecrawl/exa MCP servers are not
connected in this session, so research used WebSearch + WebFetch on primary
docs, plus direct inspection of `node_modules/app-builder-lib` 25.1.8 and
`node_modules/electron` 33.4.11. Nothing below was fetched from a login-gated
page; Partner Center itself was not opened.

## 1. Developer registration and cost

| Claim | Source | Page date | Conf |
|---|---|---|---|
| Individual developer registration is free via the new flow; "The $19 registration fee is waived in the new flow." Only entry point: https://storedeveloper.microsoft.com — other paths (direct Partner Center, Xbox, VS) show the legacy (paid) flow. | https://learn.microsoft.com/en-us/windows/apps/publish/whats-new-individual-developer | ms.date 2025-08-07, updated 2026-04-18 | A |
| The free flow requires ID-based verification: government-issued ID + selfie, captured on mobile; MFA on the MSA. | same | same | A |
| Available in "nearly 200 markets". Existing accounts cannot use the new flow. | same | same | A |
| Company accounts also have zero registration fee in the revamped onboarding. | https://learn.microsoft.com/en-us/windows/apps/publish/whats-new-company-developer | not read in full | B |
| Registration steps overview (account type, MSA sign-in, verification). | https://learn.microsoft.com/en-us/windows/apps/publish/partner-center/open-a-developer-account | not read in full | B |

Cost conclusion: **$0** registration for an Individual account if and only if
you start at storedeveloper.microsoft.com. Identity verification is a human
step (needs_authorization).

## 2. Package format, signing, hosting

| Claim | Source | Page date | Conf |
|---|---|---|---|
| Accepted upload formats: .msix, .msixbundle, .msixupload, .appx, .appxbundle, .appxupload. MSIX recommended; EXE/MSI also accepted but must be self-hosted and self-signed. | https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msix/app-package-requirements (FAQ) | ms.date 2022-10-30, updated 2026-08-24 | A |
| "Your MSIX and AppX packages don't have to be signed with a certificate rooted in a trusted certificate authority when submitting to the Microsoft Store. The Microsoft Store will automatically re-sign your MSIX/AppX packages with a Microsoft certificate during the publishing process after your app passes certification." No CA cert, .pfx, USB token or HSM needed. | same, "Code signing for Microsoft Store submissions" | same | A |
| MSIX benefits listed by Microsoft include "Free Microsoft code signing and CDN hosting." | same, FAQ | same | A |
| The Store does NOT re-sign MSI/EXE submissions (10.2.9 route); those need an Authenticode cert chaining to the Microsoft Trusted Root Program. So the NSIS installer cannot go to the Store without a paid certificate — it stays direct-download only. | same + store-policies 10.2.9 | same | A |
| Package size limit 25 GB; block map hashes SHA2-256. | same | same | A |
| Manifest values are case-sensitive and must match Partner Center's Product identity page exactly. | same | same | A |
| Sideloading an MSIX outside the Store requires self-signing; irrelevant to Store channel. | same | same | A |

## 3. Package identity

| Claim | Source | Page date | Conf |
|---|---|---|---|
| Three manifest values come from Partner Center → app → Product management → Product identity: `Package/Identity/Name`, `Package/Identity/Publisher`, `Package/Properties/PublisherDisplayName`. Also shown: Package Family Name, Package SID, Store ID. | https://learn.microsoft.com/en-us/windows/apps/publish/view-app-identity-details | ms.date 2022-10-30, updated 2025-12-18 | A |
| These values only exist after an app name is reserved in Partner Center; they cannot be guessed. `Publisher` is a Store-issued `CN=<GUID>` string. | same (values are "assigned to your app by the Microsoft Store") | same | A |
| Store listing URL format `https://apps.microsoft.com/detail/<Store ID>`. | same | same | A |
| Package identity overview (what identity grants at runtime). | https://learn.microsoft.com/en-us/windows/apps/desktop/modernize/package-identity-overview | not read in full | B |

## 4. Version format and monotonic rules

| Claim | Source | Page date | Conf |
|---|---|---|---|
| Version is four parts `Major.Minor.Build.Revision`. "the last (fourth) section of the version number is reserved for Store use and must be left as 0 when you build your package (although the Store may change the value in this section). The other sections must be set to an integer between 0 and 65535 (except for the first section, which cannot be 0)." | https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msix/app-package-requirements, "Package version numbering" | ms.date 2022-10-30, updated 2026-08-24 | A |
| The Store always delivers "the highest-versioned package that is applicable to the customer's ... device". Packages can be submitted in any order, but installed customers only move to a **higher** version. | same | same | A |
| Rollback exists only for *new* acquisitions (re-upload an older package). "Customers who have already received the package you are rolling back will still have the problematic package". The fix for existing users is "a new ... package that has a higher version number". | same, "Using version numbering to roll back" | same | A |
| Consequence for CodeLock: `apps/desktop/package.json` `version` `X.Y.Z` → manifest `X.Y.Z.0`; major must be ≥ 1 for a Store submission (`0.1.0` → `0.1.0.0` violates "the first section, which cannot be 0"). A repair release is always a bump, never a downgrade. | derived from the two rows above | — | A |
| electron-builder maps semver to the 4-part form in `AppInfo.getVersionInWeirdWindowsForm()`: `${major}.${minor}.${patch}.${buildNumber}`; buildNumber comes from `buildNumber` config / CI build-number env and defaults to `0` unless `appx.setBuildNumber: true`. Prerelease tags are dropped. | `node_modules/app-builder-lib/out/appInfo.js` lines 66–86 (read locally) | electron-builder 25.1.8 | A |

## 5. Capabilities and certification

| Claim | Source | Page date | Conf |
|---|---|---|---|
| Store Policies current version 7.20. | https://learn.microsoft.com/en-us/windows/apps/publish/store-policies | ms.date 2026-09-14, updated 2026-09-15 | A |
| 10.1.1: metadata must "accurately describe the functions, features, user experience and any important limitations"; "The value proposition of your product must be clear during the first run experience." | same | same | A |
| 10.1.2: "Your product must be fully functional and must provide appropriate functionality for targeted systems and devices." | same | same | A |
| 10.2: must not "jeopardize or compromise user security, or the security or functionality of the device"; "You will not disable any platform safety or comfort features". | same | same | A |
| 10.2.4: dependency on non-integrated software (another product/service) is allowed only "if you disclose the dependency at the beginning of the description in metadata". Non-Microsoft NT services are generally not allowed. | same | same | A |
| 10.2.7: must "clearly communicate and enable a user's ability to cleanly uninstall and remove your product". | same | same | A |
| 10.2.8: must use supported methods and obtain consent to "modify the user's Windows experience in any way"; unsupported methods include accessibility APIs and undocumented APIs. | same | same | A |
| 10.3.1 / 10.3.2: product must be testable; if it needs a server, "the server must be functional to verify that it's working correctly." | same | same | A |
| 10.4.1: if incompatible with the device, "it must detect that at launch and display a message". 10.4.2: must start promptly, not close unexpectedly, handle exceptions. | same | same | A |
| 10.5.1: a privacy policy URL is mandatory in Partner Center for any product that accesses, collects or transmits Personal Information, and "Product types that inherently have access to Personal Information must always have privacy policies. These include ... Desktop Bridge and Win32 products." | same | same | A |
| 10.5.4: personal information must be transmitted "securely, by using modern cryptography methods" (→ HTTPS to any hosted backend). | same | same | A |
| 10.6: declared capabilities "must legitimately relate to the functions of your product". | same | same | A |
| 10.8: Financial transactions — not applicable, product is Free with no IAP. | same | same | A |
| 10.14 Account Type; 11.x content policies (general, names/logos/third-party, risk of harm) exist and apply. Not read in full. | same | same | B |
| Full-trust packaged desktop apps (Electron via `Windows.FullTrustApplication`) declare `<rescap:Capability Name="runFullTrust"/>`. electron-builder's template hard-codes exactly this one capability. | `node_modules/app-builder-lib/templates/appx/appxmanifest.xml` line 26 | electron-builder 25.1.8 | A |
| The Windows App Certification Kit should be run before submission; it flags manifest problems. It is installed on this machine at `C:\Program Files (x86)\Windows Kits\10\App Certification Kit\`. Not yet run against a CodeLock package. | app-package-requirements page + local `ls` | — | A (installed) / U (results) |

## 6. Packaged-app runtime behaviour (MSIX / Desktop Bridge)

| Claim | Source | Page date | Conf |
|---|---|---|---|
| Package files are read-only under `C:\Program Files\WindowsApps\<pkg_full_name>`; "Writes to files/folders in the app package aren't allowed." | https://learn.microsoft.com/en-us/windows/msix/desktop/desktop-to-uwp-behind-the-scenes | ms.date 2025-09-09, updated 2026-01-28 | A |
| On Windows 10 1903+, **new** files/folders created under `AppData\Local`, `Local\Microsoft`, `Roaming`, `Roaming\Microsoft` are redirected to a per-user, per-package private location, merged at runtime. Opening a file that already exists in the real AppData location reads it in place with no virtualisation — "State separation also allows packaged desktop apps to pick up where an unpackaged version of the same app left off." | same, "AppData operations on Windows 10, version 1903 and later" | same | A |
| Consequence: an NSIS-installed `%APPDATA%\CodeLock\{config.json,lock-state.json,session.enc}` is readable by the Store build; new writes land in the package-private location. Microsoft's page only says "a private per-user, per-app location"; the conventional `%LOCALAPPDATA%\Packages\<PFN>\LocalCache\Roaming\CodeLock` is not named on that page — treat the exact path as **U** until observed on this machine in Phase 3. | same | same | A / U |
| All `HKCU` writes are copy-on-write to a private per-app registry location and are deleted on uninstall. So Electron's `app.setLoginItemSettings` (which writes `HKCU\...\Run`) is virtualised inside a package: the OS will not see it at logon. Packaged apps register startup through the `windows.startupTask` manifest extension instead. | same, "Registry"; electron-builder `addAutoLaunchExtension` option | same | A (registry rule) / B (startupTask mapping — from electron-builder's option docs, not tested) |
| Uninstall removes the package folder "as well as any redirected writes to AppData or the registry". | same, "Uninstallation" | same | A |
| Electron exposes `process.windowsStore`: "If the app is running as a Windows Store app (appx), this property is `true`, for otherwise it is `undefined`." | `node_modules/electron/electron.d.ts` (Electron 33.4.11), `interface Process` | Electron 33.4.11 | A |

## 7. Store update behaviour

| Claim | Source | Page date | Conf |
|---|---|---|---|
| Store apps update automatically by default; users can toggle "Update apps automatically" in Store settings; admins can disable via Group Policy / `HKLM\SOFTWARE\Policies\Microsoft\WindowsStore\AutoDownload=2`. Timing of the automatic check is not exposed or controllable by the developer. | Microsoft Q&A: https://learn.microsoft.com/en-us/answers/questions/4133894/ , https://learn.microsoft.com/en-us/answers/questions/5615190/ , https://learn.microsoft.com/en-us/answers/questions/4108374/ | 2024–2026 | B |
| electron-builder: "MSIX auto-updates are handled by the Microsoft Store (or your App Installer `.appinstaller` flow), **not** by electron-updater." Self-managed updates require NSIS. | https://www.electron.build/docs/msix/ | current (undated) | A |
| Consequence: the Store build must disable `electron-updater` (it would download an NSIS installer and try to run it over a packaged install). The "defer while locked" behaviour cannot be honoured for Store updates: **Store update timing is not controllable.** | derived | — | A |

## 8. electron-builder support for Electron 33

| Claim | Source | Page date | Conf |
|---|---|---|---|
| electron-builder **25.1.8** (installed) has the `appx` target (`out/targets/AppxTarget.js`). It writes the manifest, runs `makeappx.exe` from its `winCodeSign` vendor bundle (present at `%LOCALAPPDATA%\electron-builder\Cache\winCodeSign\...\windows-10\x64\makeappx.exe`), and when no certificate is configured logs "AppX is not signed" and uses `publisher` or `CN=ms` — i.e. an **unsigned Store-only package is a supported path in this version**. | local read of `AppxTarget.js` lines 51–170 | 25.1.8 | A |
| AppX options honoured in 25.1.8: `identityName`, `publisher`, `publisherDisplayName`, `applicationId`, `backgroundColor`, `languages`, `addAutoLaunchExtension`, `customExtensionsPath`, `showNameOnTiles`, `setBuildNumber`, `electronUpdaterAware`, `makeappxArgs`, `minVersion`, `maxVersionTested`. Validation: identityName 3–50 chars `[a-zA-Z0-9.-]`, restricted names rejected, `publisherDisplayName` falls back to `author.name`. | same + https://www.electron.build/docs/api/app-builder-lib.interface.appxoptions/ | 25.1.8 | A |
| Default `minVersion` written by 25.1.8: `10.0.14316.0` (x64), `10.0.16299.0` (arm64). | `AppxTarget.js` line 178 | 25.1.8 | A |
| `addAutoLaunchExtension` adds the startup-task extension; defaults to true only if `electron-winstore-auto-launch` is a dependency. | `AppxTarget.js` lines 290–299 | 25.1.8 | A |
| electron-builder 26.x adds a separate **`msix` target** (beta) with `createMsixupload`, `capabilities`, `enforcePackageIntegrity`, `windowsServices`; docs say "If you are starting fresh, prefer MSIX. AppX remains for backward compatibility." It requires `toolsets.winCodeSign >= 1.0.0`. Not installed here. | https://www.electron.build/docs/msix/ | current | A (docs) / U (not run) |
| Decision input: the Store accepts `.appx`/`.appxupload` per section 2. The installed 25.1.8 `appx` target is sufficient for a first submission; upgrading to 26 for `msix` is optional and would be its own commit only if a concrete 25.1.8 failure is observed. | derived from sections 2 and 8 | — | A |
| electron-builder 25.1.8 builds Electron 33 today (NSIS target, `electronVersion: 33.4.11` pinned in `electron-builder.yml`). | repo config | — | A |

## 9. Open items this research could not settle

| Item | Why | Status |
|---|---|---|
| Whether `CodeLock` (or any name) is available for reservation | Requires Partner Center login | U — human step |
| Actual `Package/Identity/Name` and `Publisher` values | Issued only after reservation | U — release blocker until provided |
| Whether the free-tier individual flow accepts the account holder's country/ID type | Per-person | U — human step |
| Whether WACK passes on an electron-builder 25.1.8 appx | Not yet built | U — Phase 2 verification |
| Exact private-AppData path used for the Store package on this machine | Not yet installed | U — Phase 3 observation |
| Whether electron-builder 25.1.8's appx passes Store ingestion (not just WACK) | Only the upload proves it | U — Phase 5 |
