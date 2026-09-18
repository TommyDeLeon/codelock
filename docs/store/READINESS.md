# Store release readiness — CodeLock desktop

Audited 2026-09-18 against the working tree at commit `174f758` plus
uncommitted changes (untouched by this audit). Companion: [RESEARCH.md](RESEARCH.md)
for every external claim.

Decisions this audit assumes (made by the owner in this session):

- **Decision #1 — backend:** **self-host URL on first run** (Option S,
  confirmed 2026-09-18 after this audit). The owner's first preference was a
  fully hosted, zero-setup service ("ready to use as soon as they installed
  it"); blockers B1/B4/B5 below are why that was deferred to a later release.
  The Store build ships with `localhost` defaults and an editable
  `config.json`; the backend stays private, matching the brief. The hosted
  path (Oracle Cloud Always Free VM — the only $0 tier that can run the judge's
  Docker sandbox — behind a subdomain of the owner's Hostinger domain, TLS via
  the existing `deploy/` Caddy stack) is recorded as the 1.1 plan in
  TEAM-HANDOFF.md, gated on B1.
- **Decision #3 — NSIS channel:** dual-channel. NSIS + electron-updater keep
  shipping from GitHub Releases; the Store package is built from the same
  version.

## 1. What a clean machine can do today

Read: `apps/desktop/src/{main,updater,config,backend,lock-state,
unlock-verifier,windows-policy}.ts`, `apps/desktop/scripts/write-defaults.mjs`,
`apps/desktop/electron-builder.yml`, `.github/workflows/release-desktop.yml`,
`README.md` §§ "Desktop packaging and trusted install", "Security boundaries",
"Data and removal", plus `apps/api/src/{app,middleware/localUser,lib/tokens}.ts`
and `deploy/`.

| Step of the minimum journey | What the current code does on a machine that does not have this repo | Verdict |
|---|---|---|
| Install | NSIS installer, unsigned, x64/arm64. SmartScreen warns; Smart App Control blocks silently (`windows-policy.ts`). A Store package would be Microsoft-signed, which removes both problems. | Works, with friction |
| First run | `config.ts` writes `%APPDATA%\CodeLock\config.json` from `build-defaults.json`. Defaults are `http://localhost:3000` / `http://localhost:4000` and an empty unlock key unless `CODELOCK_BUILD_*` were set at build time. `main.ts` then shows "CodeLock is not configured … Timers will refuse to start". | **Fails** unless the build baked a real URL + key |
| Reach the backend | `backend.ts` probes `/healthz`; if down and `backendCommand` is set it spawns it (self-host path). Otherwise after 3 min it shows "CodeLock cannot reach its server" or a "needs Docker Desktop" dialog. | Depends entirely on a reachable backend |
| Lock | Kiosk window loads `WEB_URL/lock` — the lock screen is the **hosted web app**, not the bundled renderer. Lock state persisted to `%APPDATA%\CodeLock\lock-state.json`. | Requires the web origin to be up |
| Solve | Renderer submits to `API_URL/v1/submissions`; API calls the judge (Docker-per-submission). | Requires API + judge |
| Unlock | API mints an **HS256** JWT with `JWT_UNLOCK_SECRET` (`apps/api/src/lib/tokens.ts`). Desktop verifies HS256 with the shared secret **or** RS256 with a public key (`unlock-verifier.ts`). | See blocker B2 |

## 2. Blockers, ranked

**B1 — The API is single-user with no authentication.**
`apps/api/src/middleware/localUser.ts` resolves every request to one row
(`local@codelock.invalid`); the header comment says "A sign-in screen in front
of a local database is a lock on a door in an open field." That is correct for
a private self-host and wrong for a hosted backend: every Store user would
share one profile, one progress log, one lock session (the schema enforces
"one active session per user"), and could end anyone else's lock. Hosting the
backend as-is is not "zero setup", it is one shared account for the internet.
Resolution requires reintroducing per-user identity in the API (sign-in or a
device-bound anonymous account). That is API work outside this brief's
"smallest compatible change" and outside the learn-feature area; it is the
single largest item and gates Decision #1.

**B2 — No key the Store build is allowed to ship can unlock against the current API.**
Phase 3 forbids shipping `CODELOCK_BUILD_UNLOCK_SECRET`. The desktop can verify
RS256 with a public key, but `signUnlockToken()` only issues HS256 with the
shared secret. There is no RS256 issuance anywhere in `apps/api`. A
public-key-only Store build therefore fails every unlock with `bad-signature`
(alg mismatch) — the exact "trapped behind the overlay" failure `main.ts`
refuses to arm for. Resolution: add RS256 signing to the API when a
`JWT_UNLOCK_PRIVATE_KEY` is configured (small, additive; the verifier already
handles it). Must be done before any distributed build.

**B3 — Release CI never bakes the defaults it thinks it does.**
`release-desktop.yml` sets `CODELOCK_UNLOCK_PUBLIC_KEY` / `CODELOCK_WEB_URL` on
the *electron-builder* step, but `write-defaults.mjs` runs inside
`npm run build` (the previous step) and reads `CODELOCK_BUILD_UNLOCK_PUBLIC_KEY`
/ `CODELOCK_BUILD_WEB_URL`. Two mismatches (wrong step, wrong variable names),
so every CI artifact ships `localhost` defaults and no key. Any Store build from
that workflow would be dead on arrival. Fix is a workflow edit in Phase 4.

**B4 — Public backend does not exist yet, and its URL is a build input.**
No hosted instance exists. Requires (human, `needs_authorization`): Oracle
Cloud account with card-based identity verification; DNS records on the
Hostinger domain; `deploy/.env` secrets. Until the URL exists there is nothing
truthful to bake into `CODELOCK_BUILD_WEB_URL` / `CODELOCK_BUILD_API_URL`.
Store policy 10.3.2 also requires the server to be functional during
certification. Note `deploy/.env.example` still lists `GITHUB_CLIENT_*` /
`GOOGLE_CLIENT_*` that nothing in `apps/api/src` reads — stale, harmless.

**B5 — Anonymous remote code execution on a free VM.**
The judge runs untrusted code with the Docker socket mounted
(`docker-compose.yml`: "root-equivalent on the host"). Today it is reachable
only from the compose network, and the API is meant to be private. Public
exposure without B1 means anyone can submit code with only the API's IP rate
limits as a ceiling. The container flags in README "Security boundaries" are
real, but the README itself says "Keep it private, and run only code you are
willing to execute on your machine." Store policy 10.2 makes the developer
"solely responsible for all product safety testing". Mitigation is per-user
auth (B1) + per-user quotas, not a packaging change.

**B6 — Partner Center identity does not exist.**
`identityName`, `publisher` (`CN=<GUID>`), `publisherDisplayName` are issued
only after account creation and name reservation (RESEARCH §3). The Phase 2
build will fail by design without them. Human step; cannot be invented.

**B7 — Privacy policy and support URLs.**
Policy 10.5.1 mandates a privacy policy URL for Desktop Bridge apps. The web
app has `apps/web/src/app/{privacy,terms}` routes, but they are not hosted
anywhere yet (same dependency as B4). No support URL/email is published either.
Blocker for the listing, resolves with B4 + a `CONTACT_EMAIL`.

**B8 — Version `0.1.0` is not a valid Store version.**
The first section "cannot be 0" (RESEARCH §4). The Store submission needs
`apps/desktop/package.json` at `1.0.0` or higher → manifest `1.0.0.0`. Dual
channel means NSIS moves to `1.0.0` at the same time (one source).

**B9 — Startup registration is virtualised inside a package.**
`background.ts` uses `app.setLoginItemSettings` (HKCU Run key). HKCU writes in
a packaged app are copy-on-write to a private hive the logon process never
reads (RESEARCH §6). "Reboot/startup" and "lock survives a reboot" therefore
silently stop working in the Store build unless the `windows.startupTask`
extension is declared (`appx.addAutoLaunchExtension`). The extension is
opt-in for the user in Settings → Apps → Startup, which is the policy-compliant
form of 10.2.8. `wasOpenedAtLogin` detection (`--background` argv) must also be
checked against how a startup task launches the exe — unverified.

**B10 — No root software licence.**
README "Licensing": "This repository has no root software licence … the
project must not be described as open source." Publishing a binary on the
Store does not require an open-source licence, but the listing must not claim
one, and `data/LICENSE` contradicts the README. Owner decision; not a
technical blocker. Content is CC0 per `data/NOTICE` (728 problems) — no
third-party attribution outstanding.

Non-blocking but must be handled in Phase 2:

- `electron-updater` must be disabled when `process.windowsStore === true`
  (RESEARCH §7); otherwise it would fetch an NSIS `.exe` from GitHub Releases
  and try to run it over a read-only package.
- Logs path `%LOCALAPPDATA%\CodeLock\logs` (`main.ts`) and `userData` are both
  under AppData → redirected, readable, fine. Nothing writes to the install
  directory. `app.relaunch()` on forced quit uses the package exe — fine.
- Backend auto-start (`backendCommand`) and the "install Docker Desktop"
  dialog are self-host artefacts that make no sense in a hosted Store build;
  the dialog text would violate 10.1.1 (misleading) if a hosted user ever saw
  it. Default must be empty and the diagnose copy gated on config.
- `appx` template declares only `runFullTrust` (RESEARCH §5); certification
  explanation goes in CERTIFICATION-NOTES.md.

## 3. Privacy implications of the hosted decision

With a hosted backend the desktop app transmits, per user: submitted source
code, verdicts, timings, focus/lock sessions, settings, progress, tutor and
learning-log data (README "Data and removal"). Today the README can say "there
is no account"; after B1 that sentence is false and the privacy page must
describe what is collected, retention (`BACKUP_RETENTION_DAYS=14` in
`deploy/`), and deletion. Transport is HTTPS via Caddy (10.5.4). Store policy
10.5.1 requires the policy URL at submission; 10.5.8 (children) applies if the
age rating admits under-13s — inputs recorded in Phase 4 LISTING.md.

## 4. Honest initial scope

What can truthfully be submitted once B1–B8 are cleared, and nothing more:

- **CodeLock 1.0.0 for Windows 10/11 x64 and arm64**, Free, no IAP.
- Function: a focus timer that, when it fires, covers the screen until the
  user solves a programming problem graded by the CodeLock service; hold
  Escape 10 s to abandon (recorded as a failed session). English only.
- Requires an internet connection and the CodeLock service (10.2.4
  disclosure at the top of the description). No offline solving.
- Is a commitment device, not parental control: lists the documented bypasses
  (Ctrl+Alt+Del, power-off, deleting the state file) per README "Platform
  limits", so 10.1.1 is met and 10.2 is not overstated.
- Auto-start at login as an opt-in Windows startup task.
- Updates via the Store only; the Store decides when.
- Out of scope for the first listing: macOS/Linux (unchanged, not submitted),
  mobile, self-hosting instructions (stay in README for the NSIS channel),
  the learn feature currently uncommitted in `apps/api` (ships when its owner
  ships it; the desktop build must not depend on it).

## 5. What this audit did not run

- No package was built; no WACK run (kit is installed — RESEARCH §5).
- No reboot, upgrade, or uninstall test on hardware — Phase 4.
- Partner Center was not opened (no login by rule).
- `npm test` / `npm run typecheck` were not executed in this phase (no code
  changed).

## 6. Order of work implied by the blockers

1. Owner: Oracle Free VM + DNS (B4), Partner Center registration + name
   reservation (B6), licence decision (B10). All human, all `needs_authorization`.
2. Code (Phase 2, in this order because each unblocks a test): RS256 issuance
   in the API (B2) → Store target + identity-from-env + updater gate + startup
   task (B6, B9, updater) → version 1.0.0 (B8) → CI env fix (B3).
3. Code (larger, owner to confirm scope before Phase 2 starts): per-user
   identity in the API (B1, B5). Without it the honest listing is
   **single-user self-host only**, and Decision #1 reverts to "self-host URL
   on first run".
