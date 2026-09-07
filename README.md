# CodeLock

A private, single-user commitment device. When a focus timer expires, CodeLock
takes the screen and hands you a programming problem. The way back in is a
solution that passes every test **and** lands inside a runtime budget.

It runs on one person's machine, with optional phone access over a trusted
private network. There is no account system, and **the API does not
authenticate requests** — keep every service off the public internet.

This is the only maintained document for the project. Everything operational
lives here.

---

## Contents

- [Architecture](#architecture)
- [What it costs to run](#what-it-costs-to-run)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Running individual applications](#running-individual-applications)
- [Configuration reference](#configuration-reference)
- [Calibration](#calibration)
- [Unlock and grading rules](#unlock-and-grading-rules)
- [Backups and recovery](#backups-and-recovery)
- [Mobile over a private network](#mobile-over-a-private-network)
- [Desktop packaging and trusted install](#desktop-packaging-and-trusted-install)
- [Security boundaries](#security-boundaries)
- [Platform limits — what actually beats the lock](#platform-limits--what-actually-beats-the-lock)
- [Data and removal](#data-and-removal)
- [Licensing](#licensing)
- [Verification gaps](#verification-gaps)

---

## Architecture

| Path | Responsibility |
|---|---|
| `apps/api` | Node 24, Express, Prisma, Postgres. Timers, lock sessions, grading, hints, progression, the learning log, and unlock proofs. |
| `apps/web` | Next.js 16 / React 19. The marketing site, the demo, and the lock screen the desktop shell loads. |
| `apps/judge` | A Judge0-compatible service that starts one throwaway Docker container per submission. |
| `apps/desktop` | Electron. The dashboard and the kiosk lock shell. Only this enforces anything. |
| `apps/mobile` | Expo client and a native Android overlay module. |
| `packages/shared` | The cross-client type contract. |

Postgres is the source of truth for timers, sessions, submissions, progress and
history. Old account and integration columns remain in the migration history so
existing databases still migrate; the runtime exposes no account, password,
OAuth, GitHub or LeetCode features.

**The trust boundary is the API.** Clients never conclude they are unlocked.
The API signs an unlock token only after the judge reports a pass and the speed
gate clears; the Electron main process verifies that signature in a process the
web view cannot reach, and checks that the token names the session being held.

## What it costs to run

**No metered application APIs.** Grading uses the bundled judge at
`http://127.0.0.1:2358` (or `http://judge:2358` inside Compose). `JUDGE0_URL`
is validated at boot and *refuses* any other host, so a stale environment
variable cannot silently send your code — and your money — to a hosted judge.
Problem selection is local and deterministic. No OpenAI request is made. There
is no telemetry.

This says nothing about your provider *accounts*. Removing code does not cancel
a subscription. If you previously used RapidAPI, OpenAI, Sentry, Render, Vercel
or Neon, sign in and check each one: revoke keys, delete deployed services and
databases, cancel paid plans, remove saved payment methods, and read the
billing page for pending usage.

Costs that remain regardless of this repository: electricity, hardware, a
domain, any hosting you keep, code-signing certificates, and app-store
membership.

## Prerequisites

[Node.js 24](https://nodejs.org/en/download),
[Docker Desktop](https://docs.docker.com/desktop/), and Git.

## Setup

```powershell
npm.cmd install
```

Copy the environment templates:

```powershell
Copy-Item apps/api/.env.example apps/api/.env
Copy-Item apps/web/.env.example apps/web/.env.local
```

Generate one unlock-signing secret of at least 32 characters and put it in
`apps/api/.env` as `JWT_UNLOCK_SECRET`:

```powershell
[Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(48))
```

Do not commit a populated `.env`. The Compose stack supplies its own internal
database and judge addresses, so the remaining template defaults are correct
for local use.

**The desktop app needs the same secret.** It verifies the unlock signature in
its own process and does not read `apps/api/.env`, so without a copy it
*refuses to lock at all* — deliberately, since a lock it could never open is a
trap. Give it the value in one of two ways:

```powershell
# For development: the shell that launches Electron
$env:CODELOCK_UNLOCK_SECRET = "<the same value as JWT_UNLOCK_SECRET>"
```

For an installed build, put it in the app's `config.json` (the path is printed
in the error dialog if it is missing) as `unlockSecret`. It must match
`JWT_UNLOCK_SECRET` exactly. The alternative is RS256: ship the API's *public*
key as `unlockPublicKey`, which is the better choice if the installed app is
ever on a machine whose user should not hold the signing secret.

Build and start the stack:

```powershell
docker compose up --build
```

The web app is then at [http://127.0.0.1:3000](http://127.0.0.1:3000). The
first start downloads Postgres and language images — that is an image
download, not a metered API call.

Initialise the schema and problem set from a second terminal:

```powershell
npm.cmd run db:reset
```

Stop without deleting the Postgres volume:

```powershell
docker compose down
```

## Running individual applications

Start the database and judge, then run these in separate terminals:

```powershell
npm.cmd run dev:judge
npm.cmd run dev:api
npm.cmd run dev:web
```

Start the Electron shell once the web app and API are up:

```powershell
npm.cmd run dev:desktop
```

To exercise the lock screen without waiting for a timer, arm a session and then
run the development-only expiry helper, which writes to the local database and
is not exposed as a route:

```powershell
npm.cmd run dev:expire
```

## Configuration reference

`apps/api/.env` — every key the API reads:

| Key | Default | Notes |
|---|---|---|
| `NODE_ENV` | `development` | |
| `HOST` | `127.0.0.1` | Loopback by default. Containers set `0.0.0.0` deliberately. |
| `PORT` | `4000` | |
| `DATABASE_URL` | — | Required. |
| `JWT_UNLOCK_SECRET` | — | Required, at least 32 characters. Signs unlock proofs. Rotating it invalidates every issued token. |
| `CORS_ORIGINS` | `http://localhost:3000` | A browser control, **not** authentication. |
| `TRUST_PROXY` | empty | Comma-separated proxy IPs. Empty means trust nothing, which is correct unless a reverse proxy is in front. |
| `JUDGE0_URL` | `http://127.0.0.1:2358` | Validated: loopback or `judge` only, `http`, no credentials, no query. |
| `JUDGE0_TIMEOUT_MS` | `20000` | |
| `GRADE_CONCURRENCY` | see `env.ts` | Concurrent grades process-wide. Each holds a CPU core. |
| `GRADE_QUEUE_DEPTH` | see `env.ts` | Requests allowed to wait before the API refuses. |
| `PERF_TOLERANCE` | `1.35` | Multiplier on the best known runtime. |
| `PERF_FLOOR_MS` | `40` | Noise floor added to every budget. |
| `PERF_BEST_OF` | `2` | Timed runs; the fastest counts. |

## Calibration

Runtime measurements include hardware and container noise, so a budget measured
on a fast machine can reject a correct answer on a slow one. Calibrate on the
same judge and hardware that will grade real submissions:

```powershell
npm.cmd run calibrate -- --write
```

Recalibrate after changing the judge, the language images, or the machine.

## Unlock and grading rules

A submission releases a held session only when every test passes **and** its
measured runtime falls within:

```text
best known runtime × PERF_TOLERANCE + PERF_FLOOR_MS
```

Reference runtimes are stored per language, because startup and compilation
costs differ; one global number would make the gate unreachable in one language
and free in another.

**Running is free.** `POST /v1/run` executes your code against the sample cases
or against input you type. It writes no submission, does not touch the attempt
counter, does not move the difficulty ladder, and cannot produce an unlock
token. Hidden cases never run there.

**The ladder** is three fast solves in a row to move up, two failed sessions to
move down. Nothing hidden.

## Backups and recovery

The database is the only irreplaceable state. `deploy/backup.sh` and
`deploy/restore.sh` cover a Compose deployment. For the local stack, the
Postgres volume is what matters — dump it before any destructive operation:

```powershell
docker compose exec postgres pg_dump -U codelock codelock > backup.sql
```

If a lock is stuck because the API is unreachable, the shell has two escapes:
holding Escape for ten seconds (recorded as a failed session, by design), and
the watchdog, which polls the server and drops the overlay when the session has
already ended without a token — a spent skip, a give-up from another device, or
the reaper.

## Mobile over a private network

The API and web service bind to loopback, which a phone on the same network
cannot reach. For a mobile build: bind web and API to the machine's **private
LAN address**, point the mobile API and web URLs at it, allow only the private
subnet through the host firewall, and return to loopback when finished.

Do not use port forwarding, a public tunnel, or a cloud deployment. The API has
no caller authentication, and CORS does not supply any — it is a browser
control that a direct HTTP client ignores.

Expo Go cannot load the Android overlay module; Android needs a native build:

```powershell
npm.cmd run prebuild -w @codelock/mobile
npm.cmd run android -w @codelock/mobile
```

Android will ask for notifications, display-over-other-apps, and a
battery-optimisation exemption.

## Desktop packaging and trusted install

```powershell
npm.cmd run dist -w @codelock/desktop
```

This produces an unsigned NSIS installer under `apps/desktop/release/`.
Unsigned builds trigger SmartScreen, and Windows **Smart App Control** will
silently refuse to install one — check it first:

```powershell
Get-ItemProperty 'HKLM:\SYSTEM\CurrentControlSet\Control\CI\Policy' VerifiedAndReputablePolicyState
```

`0` is off, `1` enforces, `2` evaluates. Under `1` or `2` an unsigned installer
can exit `0` having done nothing — verify the installed binary's timestamp
rather than trusting the exit code.

For signing, supply `CSC_LINK` and `CSC_KEY_PASSWORD` at build time.
`apps/desktop/scripts/sign-windows.ps1` signs an existing artefact and
`apps/desktop/scripts/install-local.ps1` installs one locally.

If `publisherName` is ever set in `electron-builder.yml` it must exactly match
the certificate's CN — electron-updater compares them and a mismatch makes
every update fail *silently*.

## Security boundaries

CodeLock is a commitment device, not a hardened security product.

- The API has rate limits, request-size limits, CORS checks and loopback
  binding, but **no authentication**.
- Submitted code runs in a throwaway container per submission, with these
  flags. Each one is one careless edit away from disappearing, so they are
  written down rather than assumed:

  | Flag | What it stops |
  |---|---|
  | `--network none` | Phoning home, exfiltrating the problem set, attacking the LAN |
  | `--memory` = `--memory-swap` | Memory bombs — OOM-killed rather than thrashing swap |
  | `--cpus 1` | One submission starving the others |
  | `--pids-limit 128` | Fork bombs |
  | `--read-only` plus a capped `tmpfs` | Any persistence between runs |
  | `--cap-drop ALL` | Every Linux capability |
  | `--security-opt no-new-privileges` | setuid escalation |
  | `--user 65534:65534` | Running as root |

  A gVisor runtime (`--runtime=runsc`) can be added for a second boundary.
- The judge holds the Docker socket. That is effectively host-administrator
  access if the judge is compromised. Keep it private, and run only code you
  are willing to execute on your machine. See
  [Docker's daemon attack surface](https://docs.docker.com/engine/security/#docker-daemon-attack-surface).
- Windows user-space locking cannot intercept Ctrl+Alt+Del, nor survive a
  power-off, another operating system, or an administrator.
- Session endings are atomic: release, skip, abandon, cancel and the stale-session
  sweep each name the expected state in the database write, so two concurrent
  requests cannot both end one lock.
- One active session per user, enforced by a partial unique index rather than by
  application code. That is what makes the daily skip allowance bounded: the
  allowance is counted per user but spent per session, so two live sessions
  would have been two allowances.

OWASP explains why CORS is not authentication in its
[REST Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html).

## Platform limits — what actually beats the lock

Every platform has a deliberate way out. Stating them is the point: a tool that
overstates what it enforces trains you to trust it exactly where it will not
hold.

**Defeats the desktop lock, confirmed by running it:**

- Killing the process (Task Manager → End Task). Relaunching restores the lock
  from `lock-state.json`, so this is temporary on a machine with the login item
  registered.
- Killing the process *and* deleting `%APPDATA%/CodeLock/lock-state.json`.
  Deliberate: a two-step act with a file manager is above the bar.
- Ctrl+Alt+Del. The Secure Attention Sequence cannot be intercepted by any
  userland process on Windows.
- A hard power-off, and booting another operating system.
- Holding Escape for ten seconds. By design, and recorded as a failed session.

**Defeats the Android overlay:** force-stop, Safe Mode, uninstall, revoked
permissions, and manufacturer battery controls. Pulling down the status bar
also works — system UI always draws above application overlays.

**iOS does not hard lock.** The module reports it as unsupported. Apple's
[Family Controls framework](https://developer.apple.com/documentation/familycontrols)
uses restricted entitlements and is not implemented here.

**The browser is not a lock surface.** A tab can be closed.

Everything else — Alt+F4, minimise, Alt+Tab, virtual desktops, second monitors,
sleep/wake, DevTools — is handled in code and was covered by unit tests, which
means *the shell decides correctly*. It does not mean anyone has watched
Windows honour that decision on hardware. See
[Verification gaps](#verification-gaps).

## Data and removal

The database stores the local profile and preferences, focus and lock sessions,
submitted source, verdicts, runtimes, progress, hints, debriefs and the
learning log. Requests are logged locally with sensitive bodies and
authorization headers redacted. There is no account-deletion screen because
there is no account.

To erase everything: remove the CodeLock Postgres database or Docker volume,
any copied backups, and client storage on each device. Inspect the volume
first — deletion is irreversible. The in-app `/privacy` and `/terms` pages
carry the user-facing notices.

## Licensing

**This repository has no root software licence.** Access to the source does not
by itself grant permission to copy, modify, or redistribute it. Adding a
deliberate root licence is an outstanding decision, and until it is made the
project must not be described as open source.

Problem content is licensed separately in [`data/LICENSE`](data/LICENSE), with
the generated attribution record in [`data/NOTICE`](data/NOTICE). Those files
must stay with the corpus. The notice currently records 728 CodeLock-authored
problems under CC0, so no third-party attribution is outstanding — keep that
claim only while provenance review supports it. Never copy LeetCode problem
statements, and exclude any material whose licence cannot be confirmed from its
primary source. Creative Commons describes CC0 at
[creativecommons.org/public-domain/cc0](https://creativecommons.org/public-domain/cc0/).

Note that `data/LICENSE` currently describes the code as "free software by the
usual definition", which contradicts the paragraph above. That sentence should
be corrected, or a licence chosen; both are decisions for the repository owner.

## Verification gaps

Written down rather than glossed over.

- **Most escape routes are unit-tested, not hardware-tested.** The shell
  provably decides correctly while locked and unlocked. Nobody has watched
  Windows honour those decisions on real hardware for most of them.
- **Reboot recovery is untested on hardware.** The lock file survives and a
  packaged build registers a login item, but a real reboot has not been watched
  through.
- **Android has not been verified on a device.** The foreground overlay service
  and boot receiver exist in source and are unverified in practice.
- **macOS and Linux are unverified.** Build configuration exists; no hardware.
- **Signing and auto-update have not been exercised end to end.**
- **There is no automated test suite.** Removed deliberately; see below.

### On tests

This repository previously carried 1219 automated tests across the API, web,
desktop and judge workspaces. They were removed at the owner's explicit request
after being used to validate the changes that preceded their removal.

The practical consequence: the Vitest suites are gone, so there is no automated
regression protection for grading, the speed gate, session state transitions, or
the unlock path — precisely the paths where a silent defect is a bypass rather
than a bug.

What still runs automatically: `npm run typecheck` in each workspace, the
production builds, the Prisma migration check in CI, `scripts/test-runtime-config.sh`
(which asserts the web app's runtime API origin and its CSP), and an advisory
`npm audit`. None of those touch lock correctness.
