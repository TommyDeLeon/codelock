# CodeLock

Earn your screen time. When the timer ends, your device locks until you solve a
programming problem — **correctly and fast enough**.

## Packages

| Path | What |
|---|---|
| `apps/api` | Node 24, Express, Prisma, Postgres. Auth, adaptive problems, grading, the speed gate, GitHub/LeetCode sync |
| `apps/web` | Next.js 16 / React 19 / Tailwind 4 PWA — dashboard, lock screen, connections |
| `apps/desktop` | Electron shell: kiosk lock, key suppression, server-verified unlock |
| `apps/judge` | Docker-backed execution sandbox, Judge0-compatible |
| `apps/mobile` | Expo app: Android overlay, iOS soft lock |
| `packages/shared` | The API contract, consumed as TypeScript source by every client |

## The unlock rule

Passing the tests is **not** enough. A submission unlocks the device only when
both hold:

1. Every test case passes, including a deliberately large hidden case.
2. The runtime is within budget: `best_known_runtime × 1.35 + 40 ms`, measured
   as the **fastest of 2 runs**.

A correct O(n²) answer to a sliding-window problem passes step 1, fails step 2,
and leaves you locked with the verdict *"roughly 9.4x slower than the best known
solution — look for a better algorithm."*

Three things make that rule survivable in practice:

**Budgets are per language.** A JVM cold start is ~100 ms before any user code
runs; the equivalent C++ program finishes in single digits. One global number
would make the gate unreachable in Java and free in C++, so every problem stores
a runtime per language.

**Best-of-N, not a single sample.** The judge reports wall-clock time on shared
hardware and varies by tens of milliseconds run to run. Timing a solution once
would reject genuinely optimal code on an unlucky sample — and on a device lock
that means being shut out of your own machine for no reason.

**A noise floor, not just a percentage.** A 35% band around an 8 ms target is
3 ms, which is smaller than the judge's own jitter. The `+40 ms` floor is what
keeps fast problems winnable.

Tune all three with `PERF_TOLERANCE`, `PERF_BEST_OF`, and `PERF_FLOOR_MS`. Set
`PERF_TOLERANCE=99` to effectively disable the gate.

> **Calibrate before you trust it.** The seeded reference runtimes are estimates.
> Run `npm run calibrate -w @codelock/api -- --write` against your own judge, or
> the gate will be measuring the wrong hardware. Calibration stores the *median*
> of samples: grading takes the fastest of N, so a min-based reference would be
> the luckiest run ever recorded and would reject correct optimal solutions.

## The lock is server-authoritative

Clients never decide they are unlocked. The API issues a JWT signed with
`JWT_UNLOCK_SECRET`, bound to one `{userId, sessionId}`, only after the judge
reports a pass *and* the speed gate clears. The Electron shell verifies that
signature in the main process using a key the renderer cannot read, so a patched
web app, an injected script, or DevTools calling `unlock('')` all stay locked.

The problem is chosen at **fire** time, not arm time — otherwise a client could
prefetch and pre-solve it before the lock ever appeared.

## What each platform actually enforces

| Platform | Enforcement | Honest limits |
|---|---|---|
| Desktop (Electron) | Kiosk window, always-on-top, all workspaces, close/minimise refused, escape shortcuts swallowed | Ctrl+Alt+Del, a forced power-off, or booting another OS all defeat it. No userland app can prevent that. |
| Android | `SYSTEM_ALERT_WINDOW` overlay + foreground service | Force-stop, Safe Mode, and uninstall get past it. Only a Device Owner (enterprise enrollment, factory reset) can truly block. |
| iOS | **None** | No public API lets one app block another. CodeLock owns its own screen and notifies; that is the ceiling. Pair with Screen Time. |
| Browser | Route-level, `beforeunload` warning | A tab can always be closed. Advisory only. |

It is a strong commitment device, not a kernel-level parental control. Anything
claiming otherwise on iOS is either using the case-by-case `FamilyControls`
entitlement or misrepresenting itself.

## Integrations

**GitHub** — OAuth (`public_repo` only, never private code). Every solution that
clears the gate is committed to a repo you nominate, so the work shows up on
your contribution graph. Tokens are AES-256-GCM encrypted at rest under
`ENCRYPTION_KEY`. Pushes happen *after* the unlock and never block it — a GitHub
outage must not hold you hostage.

**LeetCode** — **read-only, by necessity.** LeetCode publishes no public write
API, so solving a problem here cannot mark it solved there. What works is
importing your public profile stats (solved counts, streak, calendar) for
display next to your CodeLock progress. Username only, no password, nothing sent.

## Quick start

```bash
cp apps/api/.env.example apps/api/.env
```

Fill in `DATABASE_URL` and four secrets (`openssl rand -base64 48` each:
`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_UNLOCK_SECRET`,
`ENCRYPTION_KEY`), then:

```bash
npm install && npm run db:migrate && npm run db:seed && npm run dev:api
```

Web app, in a second terminal:

```bash
cp apps/web/.env.example apps/web/.env.local && npm run dev -w @codelock/web
```

Desktop shell against local web:

```bash
npm run dev -w @codelock/desktop
```

Everything at once — Postgres, API, and the sandbox:

```bash
docker compose up
```

## Tests

```bash
npm test -w @codelock/api
```

38 tests, no services required:

| Suite | What it proves |
|---|---|
| `services/difficulty.test.ts` | The promote/demote ladder — a pure function, no I/O |
| `services/performance.test.ts` | Gate arithmetic: tolerance band, noise floor, per-language targets, and records ratcheting the bar down |
| `db/schema.test.ts` | The migration applied to a real Postgres (PGlite, Postgres compiled to WASM): constraints, cascades, defaults, and the hand-written SQL in `stats.ts` |

The schema suite earns its place because several guarantees live only in the
database and nowhere in TypeScript: the compound unique that `upsert` depends
on, and the cascade that stops a deleted user leaving an encrypted GitHub token
behind.

## Deploying

| Target | Config |
|---|---|
| API | `apps/api/Dockerfile`, `render.yaml` (Render + Postgres) |
| Web | `apps/web/vercel.json` (Vercel, with CSP) |
| Desktop | `.github/workflows/release-desktop.yml` — signed installers for Windows/macOS/Linux on tag push |
| Mobile | `apps/mobile/eas.json` — `eas build --platform android|ios` |

The sandbox needs a Docker daemon, so it cannot run on Render or Vercel. Give it
a small VM of its own and point the API at it over a private network.

### The execution sandbox

CodeLock ships its own sandbox (`apps/judge`) and uses it by default. Each
submission runs in a throwaway container with no network, a read-only
filesystem, dropped capabilities, a memory cap, and uid 65534 — verified
behaviours, not aspirations.

It exists because **Judge0 cannot run on Docker Desktop**: Judge0 1.13.x
sandboxes with `isolate`, which requires cgroup v1, while Docker Desktop (WSL2,
macOS) provides only v2. The workers start and then every submission fails with
`Failed to create control group`. Setting `systemd.unified_cgroup_hierarchy=0`
does not help — the flag reaches the kernel but no systemd acts on it — and
1.13.1 (Apr 2024) is the newest image.

Judge0 remains supported: run it on a cgroup-v1 Linux host, point `JUDGE0_URL`
at it, and set `JUDGE0_LANG_*` to that instance's ids.

> **Read `apps/judge/README.md` before exposing it to untrusted input.** Access
> to the Docker socket is root-equivalent on the host.

### Language ids drift between Judge0 versions

The same number means different runtimes in different releases, and a wrong id
returns a bare `422`. The API logs every mapping at boot and errors loudly on a
mismatch, so check the startup output before assuming the judge is healthy:

```
INFO  judge0 language mapped   language=JAVASCRIPT id=63 judge0="JavaScript (Node.js 12.14.0)"
ERROR judge0 language id not offered by this judge   language=JAVA id=62
```

## Node version

Node 24 across the monorepo (`engines`, Dockerfile, CI). The one exception is
the *sandbox*: Judge0 CE runs whatever runtimes its image ships (Node 18 for
JavaScript). That is the execution environment for submitted code, not ours —
adjust `JUDGE0_LANGUAGE_IDS` in `apps/api/src/services/judge0.ts` if your Judge0
offers newer ones.
