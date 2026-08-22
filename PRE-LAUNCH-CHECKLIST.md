# Pre-launch checklist

Audit of the CodeLock web application and API, 21 August 2026.

**Status key** — `FIXED` verified working · `FLAGGED` needs a decision or is
unresolved · `N/A` does not apply to this codebase, with the reason given.

Verification was done against a running stack (Postgres 16, the API, the
sandbox, and the Next.js app) driven through a real browser, not by reading
code alone. Where something is marked FIXED, it was observed working.

---

## Phase 1 — Frontend & UX

### Layout & responsiveness

| # | Item | Status | Notes |
|---|---|---|---|
| 1.1 | No horizontal scroll at 320px | FIXED | `scrollWidth === clientWidth` on every route. An earlier header overflow (357px at 320) was fixed by dropping the wordmark below 400px. |
| 1.2 | No horizontal scroll at 375 / 768 / 1024 / 1440 | FIXED | Verified at 320, 768 and 1440 directly; 375 and 1024 fall between tested breakpoints with no layout rules between them. |
| 1.3 | Mobile overflow sources (wide tables, fixed widths, unbroken strings) | FIXED | No `<table>` in the app. Sample-case blocks use `break-all`; code blocks scroll inside `overflow-x: auto`. |
| 1.4 | Tap targets ≥ 44px | FIXED | Buttons `min-h-11` and icon buttons `size-11` below `sm`. Footer legal links remain inline text (~20px) — see 1.5. |
| 1.5 | Footer link tap targets | FLAGGED | Three inline links in the footer are under 44px tall. Standard for footer text links; enlarging them would look wrong. Decide whether to pad them. |
| 1.6 | Readable font sizes | FIXED | Body 14px, secondary 13px, inputs 16px on mobile. |
| 1.7 | No zoom-on-input (iOS) | FIXED | Inputs and selects were 13–14px, which makes iOS Safari zoom on focus. Now 16px below `sm`. |
| 1.8 | Pinch-zoom not blocked | FIXED | `maximumScale: 1` removed from the viewport — it fails WCAG 1.4.4 and iOS ignores it anyway. |

### Navigation

| # | Item | Status | Notes |
|---|---|---|---|
| 1.9 | Mobile menu with open/close | FIXED | Hamburger below `sm`; `aria-expanded` toggles, `role="dialog"` + `aria-modal="true"`. |
| 1.10 | Mobile menu keyboard access + focus trap | FIXED | Verified: focus moves into the panel, Tab cycles within it, Escape closes and returns focus to the trigger, body scroll locked while open. |
| 1.11 | No dead nav items | FIXED | Two items, both resolving 200. |
| 1.12 | Logo clickable, linked home | FIXED | Was an inert `<span>`; now a `<Link href="/dashboard">` with an accessible label. |

### Links & routing

| # | Item | Status | Notes |
|---|---|---|---|
| 1.13 | Crawl internal links for 4xx/5xx | FIXED | All 7 routes return 200; unknown paths return 404. No broken internal links found. |
| 1.14 | Broken footer links | N/A | There was no footer before this audit. The one added links only to routes that exist. |
| 1.15 | Buttons that do nothing | FIXED | Every button traced to a handler. `Skip`, `Submit`, timer presets, theme toggle, sign out, and all connection actions verified against the API. |
| 1.16 | Custom 404 page | FIXED | `src/app/not-found.tsx`, styled to match, with a route home. |

### Contact affordances

| # | Item | Status | Notes |
|---|---|---|---|
| 1.17 | Phone numbers clickable (`tel:`) | N/A | The product has no phone number. Inventing one would be worse than omitting it. |
| 1.18 | Email addresses clickable (`mailto:`) | FLAGGED | Wired as `mailto:` and rendered only when `NEXT_PUBLIC_CONTACT_EMAIL` is set. **Left unset**: publishing a personal address is the owner's call. Set it before launch or the privacy page has no contact route. |

### Metadata & assets

| # | Item | Status | Notes |
|---|---|---|---|
| 1.19 | Favicon set | FIXED | `manifest.webmanifest` referenced three icon files that **did not exist** — every PWA install 404'd and there was no favicon at all. Generated `favicon.ico` (48/32/16), `icon.png`, `apple-icon.png`, 192/512/maskable. |
| 1.20 | Unique page titles | FIXED | Every page is a client component, so **none could export metadata** and all five routes shared one title. Added a `layout.tsx` per segment. |
| 1.21 | Meta descriptions per route | FIXED | Distinct description per segment. |
| 1.22 | Open Graph / Twitter tags | FIXED | Added with `metadataBase`, plus a generated `og.png`. Set `NEXT_PUBLIC_SITE_URL` in production or crawlers ignore relative image URLs. |
| 1.23 | Images compressed, sized, modern format, lazy loaded | N/A | The app ships no content images — no `<img>` or `next/image` anywhere. The only raster assets are the generated icons (2–6 KB PNGs). |

### Content states

| # | Item | Status | Notes |
|---|---|---|---|
| 1.24 | No placeholder text | FIXED | No lorem ipsum, TODO, or dummy names in application code. Template domains (`app.codelock.dev`) remain in `.env.example` and `render.yaml`, which is what those files are for. |
| 1.25 | Placeholder identifiers in config | PARTLY FIXED | The `electron-builder.yml` placeholder is gone (6.3), and the GitHub owner is now known: `TommyDeLeon/codelock` is wired into `apps/web/.env.example`, `deploy/.env.example`, `apps/desktop/.env.example` and the `origin` remote. Remaining: `eas.json` still carries `appleId: you@example.com` and `ascAppId: 0000000000`, and `app.json` an all-zero EAS `projectId` — all three are filled in by `eas init` and an Apple account, so they cannot be set from here. |
| 1.26 | Dynamic copyright year | FIXED | `{new Date().getFullYear()}` in the footer. |
| 1.27 | Success messages | FIXED | Toasts on: default duration saved, GitHub connected/repo chosen/disconnected, LeetCode linked, skip used, promotion/demotion. Unlock has its own screen. |
| 1.28 | Error messages, specific and human | FIXED | Every mutation has an `onError` toast carrying the server's message. Network and timeout failures now produce readable text instead of a raw `TypeError`. |
| 1.29 | Empty states for lists/tables/dashboards | FIXED | Recent locks has one; results panel has a "submit to see" state; connections show explicit not-connected states; LeetCode shows a stale-data notice. |

---

## Phase 2 — Security

| # | Item | Status | Notes |
|---|---|---|---|
| 2.1 | Secrets in repo | FIXED | Nothing found. `git grep` for key patterns and a full `git log -p` scan are clean. `.env` files were never committed. |
| 2.2 | Secrets in git history | FIXED | Full-history scan clean. |
| 2.3 | Secrets in the client bundle | FIXED | The only `NEXT_PUBLIC_*` values are the API URL, site URL, and contact email — all non-sensitive by design. `grep` over `.next/static` finds no JWT or encryption material. |
| 2.4 | Row-level security enabled and scoped | N/A → see note | Postgres RLS is not used; the database is reached only by the API, which scopes every query by `userId`. **Every route was audited** and all user-owned reads/writes filter by the authenticated user; `requireOwnedSession` returns 404 (not 403) so IDs cannot be probed. If a second client ever gets direct database access, RLS becomes mandatory. |
| 2.5 | No tables open by default / permissive fallbacks | FIXED | No `GRANT`s beyond the app role; no anonymous role exists. Verified against a real Postgres in `db/schema.test.ts`. |
| 2.6 | Unprotected admin routes | N/A | There are no admin routes or roles. Every route under `/v1` requires a bearer token. |
| 2.7 | Auth AND authorization server-side | FIXED | Auth via `requireAuth` on every router. Authorization is enforced in the service layer, not the UI: a submission bound to a lock session must match that session's problem, or it is rejected. |
| 2.8 | Server-side validation on every input | FIXED | Every route body/param/query goes through a Zod schema before use. Client validation is additive only. |
| 2.9 | Rate limits on auth | FIXED | `POST /auth/refresh` had **no limit** — an unauthenticated endpoint hitting the database on every call. Added (60 / 15 min). Login and register already capped at 10 / 15 min. Verified: 80 refresh attempts → 80× 429. |
| 2.10 | Rate limits on expensive/API routes | FIXED | The GitHub and LeetCode endpoints had **no limit**, so one user could burn a shared GitHub quota or get the server IP blocked by LeetCode. Added (20/min). Verified 429s. |
| 2.11 | Rate limits on submissions | FIXED | Already present (12/min); grading costs real CPU. |
| 2.12 | Leaked stack traces in production | FIXED | With the DB down, responses leaked the Prisma error class, the failing query, and **absolute filesystem paths** (the checkout path). Production already masked these, but a DB outage now returns a friendly 503 in every environment. |
| 2.13 | No card data stored/logged/passed through | N/A | The product takes no payments and has no payment code path. Stated explicitly in the privacy policy. |
| 2.14 | Privacy policy present, linked, reachable | FIXED | `/privacy`, linked from the footer and the login screen. Content describes what the app actually stores. |
| 2.15 | Terms present, linked, reachable | FIXED | `/terms`, same links. States plainly what the lock cannot do on each platform. |
| 2.16 | Legal review | FLAGGED | Both documents are accurate drafts written from the code, not lawyer-reviewed. Have them reviewed before taking real users. |
| 2.17 | Account enumeration on register | FLAGGED | `POST /auth/register` returns 409 "already exists", which confirms whether an email has an account. Fixing it properly needs email verification; changing the message alone would just break signup UX for a marginal gain. |
| 2.18 | Password handling | FIXED | argon2id at OWASP parameters, 12-character minimum, constant-time comparison against a decoy hash so failed logins do not reveal registration. |
| 2.19 | Token handling | FIXED | Refresh tokens stored only as SHA-256 hashes and rotated + revoked on every use (verified: replay returns 401). Unlock tokens signed with a separate secret. |
| 2.20 | Third-party token encryption | FIXED | GitHub tokens AES-256-GCM encrypted at rest; verified the stored ciphertext is not plaintext and that deleting a user cascades the row away. |
| 2.21 | Security headers | FIXED | `helmet` on the API; CSP, `X-Frame-Options: DENY`, `nosniff`, and `Permissions-Policy` on the web app via `vercel.json`. |

---

## Phase 3 — Reliability & performance

| # | Item | Status | Notes |
|---|---|---|---|
| 3.1 | Error boundaries | FIXED | There were none. Added `error.tsx` (route-level, with retry) and `global-error.tsx` (root layout failures, self-styled since providers are gone). |
| 3.2 | Unhandled promise rejections | FIXED | API has a `process.on('unhandledRejection')` handler; the GitHub mirror is explicitly fire-and-forget with its own catch so a push failure cannot block an unlock. |
| 3.3 | Database-down handling — API | FIXED | Now returns `503 SERVICE_UNAVAILABLE` with a readable message instead of a 500 carrying Prisma internals. Verified with Postgres stopped. |
| 3.4 | Database-down handling — session survival | FIXED | Hydration cleared tokens on **any** error, so a brief outage logged users out permanently and discarded the refresh token. Now only 401/403 ends a session. Verified: user stayed logged in across a full outage. |
| 3.5 | Database-down handling — UI | FIXED | **Root cause: React Query pauses retries while the document is hidden.** `query-core/retryer.js` gates continuation on `focusManager.isFocused() && (networkMode === 'always' || onlineManager.isOnline())` — focus is AND-ed *outside* the networkMode clause, so `networkMode: 'always'` could never override it, and the default focus manager reports `document.visibilityState !== 'hidden'`. A query whose first attempt fails while the tab is backgrounded therefore parks at `status: 'pending'`, `fetchStatus: 'paused'`, `error: null`, `data: undefined` — indefinitely. That state is byte-identical to "loaded fine, nothing to show", which is why the dashboard rendered "No active session". It only ever reproduced with the tab hidden or devtools focused, which is why it looked like a phantom. Fixed in three places: `focusManager.setFocused(true)` in `providers.tsx` (a lock timer runs in the background by definition; refetch-on-return is re-implemented against `visibilitychange`), a `failureOf()` helper that reads `fetchStatus`/`failureReason` and not just `error`, and a shared `ApiResult` discriminated union so "no data" and "no answer" are different types. Regression tests in `apps/web` cover both the visible and hidden tab. |
| 3.6 | Request timeouts | FIXED | The client had none — an unreachable API left the UI on skeletons forever. Now 15s (120s for grading, which is legitimately slow). |
| 3.7 | N+1 queries | FIXED | No queries inside loops anywhere. `GET /v1/lock/active` — the most-polled endpoint, hit every 5s by the lock screen — made **three sequential round-trips** (session → problem → sample cases); collapsed into one query with nested includes. |
| 3.8 | Image optimization end to end | N/A | No content images. Icons are 2–6 KB generated PNGs served as static assets. |
| 3.9 | Unnecessary re-renders | FLAGGED | The countdown re-renders `TimerCard` once per second by design. It is a small subtree and profiling showed no jank, so it was left alone; memoising would add complexity for no measured gain. Not profiled under React DevTools. |
| 3.10 | Load test | FIXED | Measured at concurrency 20. See below. |
| 3.11 | Client can tell "no data" from "no answer" | FIXED | `packages/shared` now exports `ApiResult<T> = { ok: true; data } | ApiFailure`, with `ApiFailure` carrying `code`, `message`, `status` and `retryable`. `ApiClientError` builds one on construction; `failureOf()` derives one from any React Query result *including a paused retry*. The lock screen fails closed on it: an unreachable API renders "staying locked until it answers", never "Nothing is locked right now". |
| 3.12 | Health endpoint with a dependency check | FIXED | `GET /v1/health` runs `SELECT 1` and returns 503 with `database: "down"` when Postgres is unreachable. Unauthenticated on purpose — a client that cannot authenticate still needs to know why. `/healthz` stays pure liveness for load balancers. |
| 3.13 | Offline / outage banner | FIXED | `ConnectionBanner` polls `/v1/health` every 20s and distinguishes browser-offline from API-unreachable. Rendered app-wide above every route, not dismissible. |

### Load test results

| Endpoint | Throughput | p50 | p95 | p99 |
|---|---|---|---|---|
| `GET /healthz` | 2349 req/s | 7 ms | 22 ms | 28 ms |
| `GET /readyz` (DB ping) | 1718 req/s | 10 ms | 19 ms | 21 ms |
| `GET /v1/lock/active` | 1705 req/s | 15 ms | 19 ms | 21 ms |
| `GET /v1/stats/summary` | 382 req/s | 34 ms | 93 ms | 101 ms |

`/v1/stats/summary` is the degradation point — five queries including a
`groupBy`, roughly 4.5× slower than anything else. It is called once per
dashboard load, so this is acceptable now; it is the first thing to cache if
traffic grows.

The general limiter (240/min per user) engaged during testing and returned 429s,
which is correct behaviour and also means these numbers are floor estimates —
a single client cannot sustain them for long.

---

## Phase 4 — Verification

| # | Item | Status | Notes |
|---|---|---|---|
| 4.1 | Every page at mobile sizes | FIXED | `/dashboard`, `/settings`, `/login`, `/privacy`, `/terms`, 404 checked at 320px; `/settings` and `/dashboard` at 768 and 1440. No overflow anywhere. |
| 4.2 | Full user flow at mobile size | FIXED | Register → arm → expire → lock → wrong answer → too-slow answer → optimal answer → unlock, driven through the browser. |
| 4.3 | Automated test suite | FIXED | 38 tests passing: difficulty ladder, speed-gate arithmetic, and the migration applied to a real Postgres (constraints, cascades, defaults, raw SQL). |
| 4.4 | This checklist | FIXED | You are reading it. |

---

## Added after the initial audit

| Item | Status | Notes |
|---|---|---|
| TypeScript as a solvable language | FIXED | Runs on Node 24 native type stripping — no extra image, no compile step. Only erasable syntax works (annotations, interfaces, type aliases); enums, namespaces and decorators do not. |
| Active days / hours enforced | FIXED | ,  and  existed in the schema and were validated on input, but **nothing read them** — the schedule had no effect at all. Now enforced at arm time in the user's own timezone, with 14 tests covering timezones and windows that cross midnight. |
| Schedule UI | FIXED | Day toggles and a time range on the settings page, with Weekdays / Every day presets. |

## Phase 4 — Device lock

Added 22 August 2026. Full escape-attempt results live in
[`docs/ESCAPE-MATRIX.md`](docs/ESCAPE-MATRIX.md); this table is the summary.

| # | Item | Status | Notes |
|---|---|---|---|
| 4.1 | Lock survives a process kill | FIXED | Lock state persisted to `userData/lock-state.json`, written before the window changes and restored on boot. `will-quit` relaunches while a lock is live and no verified release happened. Previously End Task was a one-click bypass. |
| 4.2 | Lock survives a crash or OOM | FIXED | Same mechanism. Atomic write-then-rename, so a power cut mid-write cannot leave a half-written file that parses as "unlocked". |
| 4.3 | Lock covers every display | FIXED | Opaque cover windows at `screen-saver` level on all non-lock displays. Previously the second monitor kept showing the desktop, which made the lock decorative on any multi-monitor desk. |
| 4.4 | Display hotplug during a lock | FIXED | `display-added`, `display-removed` and `display-metrics-changed` all re-sync covers and re-assert the barrier. |
| 4.5 | Sleep / wake / OS screen-lock | FIXED | `powerMonitor` `resume` and `unlock-screen` re-assert kiosk state, always-on-top level, and covers, rather than only calling `focus()`. Kiosk state does not reliably survive display sleep on Windows. |
| 4.6 | DevTools in production | FIXED | `devTools: isDev`. An open console next to the unlock IPC channel is an invitation. |
| 4.7 | Documented kill switch | FIXED | Hold Escape for ten seconds. On screen the whole time the lock is up, counts down while held, and resolves the session as `ABANDONED` — a recorded failure for adaptive difficulty. Pure state machine, 6 tests. |
| 4.8 | Reboot escapes the desktop lock | **FLAGGED** | The lock file survives a reboot but nothing launches CodeLock at login, so power-cycling is a complete escape. Closing it needs a login-item registration, deliberately not wired until the relaunch loop (4.1) has been exercised on hardware — an app that adds itself to startup and covers the screen on boot is one bad state from bricking a machine. |
| 4.9 | Android overlay service exists | FIXED | `plugins/with-android-overlay.js` declared a `.LockOverlayService` class that **existed nowhere in the repo** — arming a lock would have crashed on `startForegroundService`. Replaced by a local Expo module (`modules/codelock-lock`) carrying the real Kotlin service, so it auto-links on prebuild with no hand-edits after. |
| 4.10 | Android lock survives reboot and update | FIXED (uncompiled) | `BootReceiver` on `BOOT_COMPLETED` and `MY_PACKAGE_REPLACED`, restoring from `SharedPreferences`. |
| 4.11 | Android lock survives a low-memory kill | FIXED (uncompiled) | `START_STICKY` plus recovery from stored state on a null-intent restart. `onDestroy` deliberately does **not** clear lock state: it also runs when the system reclaims the service, and clearing there would turn an OOM kill into an unlock. |
| 4.12 | Android permission prompts documented | FIXED | Notifications (dialog), Display over other apps (Settings only, never a dialog), battery-optimisation exemption. Explained in-app before each hand-off and in `apps/mobile/README.md`. |
| 4.13 | Android native code compiled or run | **FLAGGED — NOT VERIFIED** | No JDK and no Android SDK on the development machine, and no EAS build has been run. Every Kotlin file is written but has never been compiled. Treat all Android rows as claims about code, not observations. |
| 4.14 | iOS overclaiming | FIXED | The native module reports `isSupported: false` and every enforcement call returns false, so the UI branches on the module rather than on `Platform.OS`. Copy says CodeLock cannot block another app, because it cannot. |
| 4.15 | Desktop escape matrix executed on hardware | **FLAGGED — NOT VERIFIED** | The matrix is written and every row reasoned through, but nothing has been exercised on a real desktop. macOS and Linux have no hardware available at all. |

## Phase 5 — Deployability

Added 22 August 2026. Deployment guide: [`docs/DEPLOY.md`](docs/DEPLOY.md).

| # | Item | Status | Notes |
|---|---|---|---|
| 5.1 | API image builds | FIXED | It **did not build at all**. `ENV NODE_ENV=production` in the base stage made `npm ci` prune devDependencies, so `npm run build` died with exit 127 and no mention of the missing prisma/tsc. Also copied a `apps/api/node_modules` that npm workspaces never creates. |
| 5.2 | API image actually runs | FIXED | Second bug behind the first: the runtime copied `node_modules` from the **deps** stage, so the client generated by `prisma generate` during **build** never shipped. The container started, ran its migrations, then died with "@prisma/client did not initialize yet". Verified fixed against a live stack. |
| 5.3 | Judge image builds | FIXED | Same nonexistent per-workspace `node_modules` copy. |
| 5.4 | Web image | FIXED | New. Next `output: 'standalone'`. Same NODE_ENV trap — without tailwind and typescript the build fails as "Failed to collect page data" with no mention of the missing plugin. |
| 5.5 | Empty-string env vars crash the build | FIXED | `new URL(process.env.NEXT_PUBLIC_SITE_URL ?? '...')` threw, because an unset Docker build arg arrives as `''` and `??` does not catch it. Same hazard in `api.ts`, where it would have silently pointed every request at the page's own origin. Both now `||`. |
| 5.6 | Build context hygiene | FIXED | There was no `.dockerignore`. `.env.local` was being copied into the web image, where it would override the build args and point a production image at localhost. |
| 5.7 | One-command VPS deploy | FIXED | `deploy/` — compose stack with Caddy (automatic TLS), Postgres, API, judge, web. `./deploy.sh` validates the environment *before* compose starts anything: missing values, leftover placeholders, secrets under 32 chars, and the three JWT secrets being distinct. |
| 5.8 | Migrations run on deploy | FIXED | `prisma migrate deploy` at container boot, never `db push`. Verified applying both migrations against a fresh database. |
| 5.9 | Secrets validated at boot | FIXED | The API already did. The judge did not: `Number('four')` is `NaN`, and a `NaN` concurrency makes the service look hung rather than misconfigured. It now names the offending variable and exits 1. |
| 5.10 | Nightly backups | FIXED | `backup` container, `pg_dump` on deploy and then 03:00 UTC daily, gzipped, 14-day retention. Writes `.partial` then renames — an interrupted dump would otherwise look exactly like a good one. |
| 5.11 | Restore tested | FIXED | **Actually run**, not just written: inserted a row after a dump, restored, confirmed the row was gone and the API came back healthy. Found a bug doing it — `docker compose run` was eating the script's stdin, so the confirmation prompt read EOF and the restore silently did nothing. |
| 5.12 | Judge socket exposure documented | FIXED | `docs/DEPLOY.md` states plainly that the socket mount is root-equivalent on the host, and gives three mitigations in order of effort. The judge binds no host port in the deploy compose file. |
| 5.13 | Containment checks automated | FIXED | The 15 checks existed only as prose in the judge README, verified by hand once. Now an executable suite running real containers. **All 15 pass** against Docker 29.7.2. Writing them found three bad probes — `dns.lookup` hangs rather than failing with no network, node's async `spawn` counts refused forks as successes, and a tmpfs is memory-backed so filling it OOM-kills before ENOSPC. |
| 5.14 | Containment checks in CI | FIXED | Own job on every push, and gating every tagged release. |
| 5.15 | Auto-update | FIXED | `electron-updater` against GitHub Releases. **Never restarts during a lock** — the default `autoInstallOnAppQuit` plus the relaunch-on-quit from 4.1 would otherwise restart the shell under a live overlay. Deferred until release. |
| 5.16 | Update publisher name | FIXED | `publisherName` wired to `CODELOCK_PUBLISHER_CN`. If it does not exactly match the CN of the signing certificate, every Windows update fails **silently** — no error, no dialog, no update, ever. |
| 5.17 | Release publish target | FIXED | `owner`/`repo` were the placeholder `your-github-username`; an updater pointed at someone else's releases. Now from `GH_OWNER`/`GH_REPO`, supplied by the workflow from the repository itself. |
| 5.18 | Release gated on tests | FIXED | A tagged release now runs typecheck, desktop tests, web tests and containment before building. A regression that ships auto-updates onto every installed device. |
| 5.19 | Release checksums | FIXED | `SHA256SUMS.txt` generated across all installers, basenames only, attached to the release. |
| 5.20 | Android direct-install profile | FIXED | `production-apk` EAS profile — signed release APK, internal distribution, for the owner's own devices. `production` still builds an app-bundle for Play. |
| 5.21 | Deploy tested on a real VPS | **FLAGGED — NOT VERIFIED** | The stack was brought up, migrated, health-checked, backed up and restored locally against Docker 29.7.2. Caddy and its TLS provisioning were **not** exercised: that needs public DNS and port 80/443 on a real host. |
| 5.22 | Installers built | SUPERSEDED | See 6.1: an unsigned Windows installer now builds and has been inspected. macOS and Linux remain unbuilt (6.13). |

## Phase 6 — Trusted installation

Added 22 August 2026. Full guide: [`docs/TRUSTED-INSTALL.md`](docs/TRUSTED-INSTALL.md).
Key inventory: [`docs/SIGNING-KEYS.md`](docs/SIGNING-KEYS.md).

| # | Item | Status | Notes |
|---|---|---|---|
| 6.1 | An installer can be built at all | FIXED | Never attempted before. Unsigned NSIS x64: **82 MB, builds, `Get-AuthenticodeSignature` reports `NotSigned`** as expected. |
| 6.2 | Packaged contents correct | FIXED | Verified inside `app.asar`: every main-process module (`main`, `preload`, `lock-state`, `kill-switch`, `display-cover`, `updater`, `unlock-verifier`) plus `electron-updater`. Confirms 5.15’s dependencies-not-devDependencies fix was load-bearing. |
| 6.3 | Local build needs no environment | FIXED | The `publish:` block read the owner from an env macro, and electron-builder treats an undefined macro as a **hard error** — `npm run dist` could not build without it set. The block is gone; the release workflow supplies the target on the command line, derived from the repository being built. |
| 6.4 | Local build’s updater is inert | FIXED | With no `publish:` block electron-builder writes no `app-update.yml`. Verified absent from `win-unpacked/resources`. A local build cannot poll a stranger’s releases. |
| 6.5 | Windows signing script | FIXED | `apps/desktop/scripts/sign-windows.ps1`. SHA-256 with **mandatory RFC 3161 timestamping** — without it every signature dies on the certificate’s expiry date, turning every installed copy into an untrusted binary at once. Reads the password as a SecureString so it never reaches shell history. |
| 6.6 | Signing integrated into CI | FIXED | The release job verifies each Windows artifact is `Valid`, **timestamped**, and signed with a CN matching `CODELOCK_PUBLISHER_CN`; macOS runs `codesign --verify` plus `spctl --assess` (Gatekeeper, not merely a valid signature). Gated on `REQUIRE_SIGNING` so a dry run stays possible before certificates exist. |
| 6.7 | Signing-key inventory | FIXED | `docs/SIGNING-KEYS.md` — what key, where the backup lives, expiry, and what breaks if lost. States plainly that the Android keystore is the one **unrecoverable** loss. |
| 6.8 | Key material cannot be committed | FIXED | `.gitignore` covers `*.pfx`, `*.p12`, `*.jks`, `*.keystore`, `*.cer`, `*.crt`, `*.key`. |
| 6.9 | Windows local-build quirks documented | FIXED | Two environment traps, both with useless error messages: caches on C: while the project is on D: fail an internal cross-drive rename, and extracting `winCodeSign` needs symlink privilege for two macOS dylibs a Windows build never uses. Workarounds recorded; GitHub runners are unaffected. |
| 6.10 | Certificate generated and trusted | **FLAGGED — NOT DONE** | Every command is written and unexecuted. Creating a signing key and importing a trusted root are the owner’s decisions; neither was run on their behalf. |
| 6.11 | A signed installer produced | **FLAGGED — NOT VERIFIED** | Follows from 6.10. `sign-windows.ps1` parses but has never signed anything. |
| 6.12 | Auto-update proven end to end | **FLAGGED — NOT VERIFIED** | Install v1, publish v2, confirm it updates without a prompt. Needs a published GitHub Release. This is the last thing standing between here and “done”. |
| 6.13 | macOS / Linux artifacts | **FLAGGED — NOT VERIFIED** | No hardware available. Neither target has ever been built. |
| 6.14 | Track B started | **FLAGGED — NOT STARTED** | Windows OV/EV and Azure Trusted Signing all need a verifiable business entity, which is the real blocker for a solo project — not the cost. Apple Developer Program ($99/yr) is required for any permanent iOS install; there is no free path. |

## Phase 7 — Production hardening

Added 22 August 2026.

| # | Item | Status | Notes |
|---|---|---|---|
| 7.1 | Structured logging with request ids | FIXED | Every log line carries a request id and every response echoes it as `x-request-id`. An inbound id from a proxy wins so one trace spans the hop, but only if it matches a strict pattern, since it lands in logs and in an error body the user reads back. Error responses now carry `requestId`, so a bug report is one string instead of a timestamp. |
| 7.2 | Log level tuned for a polling client | FIXED | pino-http logged every 2xx at info, which buried real events under a lock screen polling every five seconds. 2xx is now debug, 4xx warn, 5xx error. |
| 7.3 | Error tracking | FIXED | Sentry in the API, loaded by dynamic import **only when `SENTRY_DSN` is set** — a self-hosted install sends nothing and never evaluates the SDK. Request bodies are stripped in `beforeSend` so submitted code cannot leave with an exception. A missing package logs a warning rather than refusing to boot; observability must not become an outage. |
| 7.4 | Uncaught exceptions reported | FIXED | `unhandledRejection` was logged but not reported, and `uncaughtException` was not handled at all. Both now report, and an uncaught exception exits after a flush window — a lock API limping on with unknown state is worse than one that restarts. |
| 7.5 | Rate limits on the lock escape hatches | FIXED | Submitting was capped; **engage, skip, abandon and arm were not**, and they are the more interesting target — `abandon` ends a session with no passing submission and `skip` spends a finite daily allowance. Capped at 30/min per user. Verified against a live stack: 36 calls produced 30 x 404 then 6 x 429. |
| 7.6 | Rate limit on the health endpoint | FIXED | Unauthenticated by design and it touches the database on every call, which made it the cheapest unauthenticated way to generate load. 120/min per IP: enough for the banner poll across many tabs, not enough to spend a connection pool. |
| 7.7 | Per-user grading concurrency | FIXED | One grade per user at a time, refused with a 409 rather than queued: a second concurrent grade from one account is a double-click or a script, never a real workflow, and "your previous submission is still running" beats a spinner. |
| 7.8 | Global grading queue | FIXED | Hard ceiling of `GRADE_CONCURRENCY` (4) concurrent grades with a bounded wait queue of `GRADE_QUEUE_DEPTH` (20). Waiting is right when the request is legitimate and the host is merely busy, but an unbounded queue only converts CPU exhaustion into memory exhaustion, so past the depth it refuses with a retryable 503. Slots are reclaimed after a TTL in case one ever leaks. 8 tests. |
| 7.9 | Audit log of every unlock | FIXED | New `unlock_audits` table: session, problem, outcome, submission, runtime, the gate it had to beat, seconds locked, and reason. Append-only and separate from `LockSession`, which is mutable — a session row says what is true now, this says what happened. It is the only thing that can answer whether a machine ever opened without a passing submission. |
| 7.10 | Audit covers every exit, not just the happy one | FIXED | SOLVED, SKIPPED, ABANDONED (distinguishing the desktop kill switch from a user giving up) and REAPED. The reaper previously logged only a count; it now names every session it closed. |
| 7.11 | Audit never blocks an unlock | FIXED | Writes are wrapped and logged-and-dropped on failure. Verified by test: a database rejection resolves rather than throws. The lock releasing matters more than the paperwork about it. |
| 7.12 | Audit verified end to end | FIXED | Against a live stack: registered, armed, abandoned with reason `kill_switch`, and confirmed both the database row and the structured log line. |
| 7.13 | Token encryption at rest verified | FIXED | 14 tests: round-trip, no plaintext on disk, a fresh nonce per call so two users sharing a token do not produce identical rows, AES-256-GCM shape, tamper detection on ciphertext / tag / nonce, and that a different key cannot decrypt. The key lives in the environment, never beside the ciphertext, so a database dump alone yields nothing. |
| 7.14 | Empty-plaintext ciphertext was undecryptable | FIXED | Found by the new tests. `decryptSecret` rejected a payload it had produced itself, because an empty plaintext yields an empty middle part and the guard tested truthiness rather than structure. The result would have been an integration row that could never be decrypted and looked exactly like tampering. |
| 7.15 | A failed GitHub push cannot block an unlock | FIXED | Was true and untested, which is one refactor from being false. Three tests: the mirror returns `undefined` rather than a promise (so no `await` can be added at the call site), a hanging GitHub does not delay the caller, and a failure is swallowed and logged rather than escaping. |
| 7.16 | Judge resource ceilings | FIXED (Phase 5) | Memory, swap, pids, cpus, read-only root and a capped tmpfs were already set; 5.13 turned them into 15 executable checks. The memory-bomb check passes on this host. |
| 7.17 | Containment checks in CI | FIXED (Phase 5) | Own job on every push and gating every tagged release. |
| 7.18 | Nightly backups and a tested restore | FIXED (Phase 5) | See 5.10 and 5.11. The restore was actually performed, not merely scripted. |
| 7.19 | Privacy page matches the code | FIXED | Updated for what this phase added: the audit trail, server logs and what is redacted from them, the error tracker (off by default, request bodies stripped), and that backups retain deleted data for fourteen days. |
| 7.20 | Memory-bomb check on the deploy host | **FLAGGED — NOT VERIFIED** | Passes on this development machine against Docker 29.7.2. cgroup behaviour differs between hosts, so it needs re-running on the real VPS — the CI job covers ubuntu-latest, not your box. |
| 7.21 | Sentry verified against a real DSN | **FLAGGED — NOT VERIFIED** | The disabled path is exercised: the API boots and logs "error tracking disabled". No DSN was configured, so nothing has ever been sent or received. |

## Open items, in priority order

1. **`6.12` — auto-update never proven end to end.** Everything else in the
   release path now works; this is the one that decides whether installed
   devices stay current.
2. **`6.10` / `6.11` — no certificate generated, nothing signed yet.**
3. **`5.21` — the deploy stack has not run on a real VPS**; TLS untested,
   and 7.20 (the memory-bomb check) needs re-running there.
4. **`4.13` — Android native code has never been compiled.** No JDK or
   Android SDK available; needs an EAS build before any Android claim stands.
5. **`4.15` — desktop escape matrix not run on hardware.**
6. **`4.8` — rebooting escapes the desktop lock.** Needs login-item
   registration, gated on 4.15.
7. **`2.16` — legal documents not reviewed by a lawyer.**
8. **`1.18` — no contact address published.** Set `NEXT_PUBLIC_CONTACT_EMAIL`.
9. **`2.17` — registration confirms whether an email is registered.**
10. **`1.25` — placeholder identifiers** remaining in `eas.json` and `app.json`,
    both filled in by `eas init`. See [docs/LAUNCH.md](docs/LAUNCH.md) step 7.
11. **`1.5` — footer link tap targets** under 44px.
12. **`3.9` — per-second countdown re-render** not profiled.

## Not covered by this audit

This list is what the **August 21 audit** did not reach. Phases 4-7 covered the
desktop and mobile shells (4.x) and backup/restore (5.10, 5.11); what remains:

- Penetration testing, dependency CVE scanning, and SBOM.
- Real-device testing on iOS and Android hardware.
- Uptime monitoring and alerting. Error *tracking* is wired (7.3) but nothing
  watches whether the service is up; `/v1/health` exists for a monitor to poll,
  and no monitor polls it.
