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
| 1.25 | Placeholder identifiers in config | FLAGGED | `electron-builder.yml` has `owner: your-github-username`; `eas.json` has `you@example.com` / `ascAppId: 0000000000`. Harmless until you publish or submit to a store, at which point they must be real. |
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
| 2.12 | Leaked stack traces in production | FIXED | With the DB down, responses leaked the Prisma error class, the failing query, and **absolute filesystem paths** (`D:\Cowork\codelock\...`). Production already masked these, but a DB outage now returns a friendly 503 in every environment. |
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
| 3.5 | Database-down handling — UI | **FLAGGED — UNRESOLVED** | With the API returning 503, the dashboard still renders "No active session" and the lock screen "Nothing is locked right now" rather than an error. Requests demonstrably fire and return 503 (confirmed in the network log), yet the hooks report `error: null`, `isLoading: false`, `data: undefined`. Ruled out: stale bundle (the new code is in the served JS), paused queries (requests do fire), `networkMode` (set to `always`, no change), auth gating. **Root cause not identified.** This is the one item that is worse than cosmetic: a user with a running timer could be told they have none and start a second. |
| 3.6 | Request timeouts | FIXED | The client had none — an unreachable API left the UI on skeletons forever. Now 15s (120s for grading, which is legitimately slow). |
| 3.7 | N+1 queries | FIXED | No queries inside loops anywhere. `GET /v1/lock/active` — the most-polled endpoint, hit every 5s by the lock screen — made **three sequential round-trips** (session → problem → sample cases); collapsed into one query with nested includes. |
| 3.8 | Image optimization end to end | N/A | No content images. Icons are 2–6 KB generated PNGs served as static assets. |
| 3.9 | Unnecessary re-renders | FLAGGED | The countdown re-renders `TimerCard` once per second by design. It is a small subtree and profiling showed no jank, so it was left alone; memoising would add complexity for no measured gain. Not profiled under React DevTools. |
| 3.10 | Load test | FIXED | Measured at concurrency 20. See below. |

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

## Open items, in priority order

1. **`3.5` — DB-down UI shows "nothing here" instead of an error.** Unresolved,
   root cause unknown. Reproduce by stopping Postgres with a signed-in session.
2. **`2.16` — legal documents not reviewed by a lawyer.**
3. **`1.18` — no contact address published.** Set `NEXT_PUBLIC_CONTACT_EMAIL`.
4. **`2.17` — registration confirms whether an email is registered.**
5. **`1.25` — placeholder identifiers** in `electron-builder.yml` and `eas.json`.
6. **`1.5` — footer link tap targets** under 44px.
7. **`3.9` — per-second countdown re-render** not profiled.

## Not covered by this audit

- Penetration testing, dependency CVE scanning, and SBOM.
- Real-device testing on iOS and Android hardware.
- The desktop and mobile shells; this pass covered the web app and API.
- Backup and restore procedures for the database.
- Uptime monitoring and alerting — `error.tsx` logs to the console, which
  nobody watches in production. Wire a reporter before launch.
