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
- [Deploying the marketing site](#deploying-the-marketing-site)
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
| `apps/web` | Next.js 16 / React 19. The lock screen the desktop shell loads, plus the in-app privacy and terms notices. |
| `codelock-marketing` | Next.js 16 / React 19. The public site and the browser demo, deployed separately. Makes no API call: the demo grades in the browser. |
| `apps/judge` | A Judge0-compatible service that starts one throwaway Docker container per submission. |
| `apps/desktop` | Electron. The dashboard and the kiosk lock shell. Only this enforces anything. |
| `apps/mobile` | Expo client and a native Android overlay module. |
| `packages/shared` | The cross-client type contract. |
| `packages/ui` | The palette, design tokens, and the components the lock screen and the demo both render, so the demo cannot drift from the thing it demonstrates. See [docs/DESIGN.md](docs/DESIGN.md). |

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

## Deploying the marketing site

`codelock-marketing` is the only part of this repository meant to be public. It
is seven static routes with no API client — the demo grades in the browser — so
it deploys to Vercel as static output and needs no secrets.

On Vercel, set the project's **Root Directory** to `codelock-marketing`. The
rest is in [`codelock-marketing/vercel.json`](codelock-marketing/vercel.json),
including an install command scoped to three workspaces:

```
npm install --workspace=@codelock/marketing --workspace=@codelock/ui   --workspace=@codelock/shared --include-workspace-root
```

The scope matters. A plain workspace install pulls in `apps/desktop`, whose
Electron download is roughly 100 MB of build time and one more thing that can
fail — on a deployment that never runs Electron. Measured on a clean tree: 28
seconds and 525 MB scoped, against 2.2 GB unscoped.

**Environment variables.** None are required. `NEXT_PUBLIC_SITE_URL` sets the
canonical origin for Open Graph tags and the sitemap; leave it unset and the
build falls back to Vercel's own production hostname, which is correct for a
preview and correct for production until a custom domain is attached. Set it to
the custom domain once there is one, or the sitemap will advertise the
`.vercel.app` host. `NEXT_PUBLIC_RELEASE_TAG` turns the install page's download
buttons into real links once a release is cut; unset, the page shows the
build-from-source path instead.

**Custom domain.** Add the domain in Vercel, then point DNS at it from wherever
the domain is registered — an `A` record for the apex and a `CNAME` for `www`,
using the values Vercel shows. Registrar and host are different jobs; buying the
domain somewhere does not mean serving the site from there.

**`apps/web` is not deployed publicly.** It serves the lock screen that the
desktop shell loads from `http://localhost:3000` on the user's own machine,
plus the in-app notices. Its metadata sets `robots: { index: false }`
deliberately.

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

**The source code is MIT-licensed.** See [`LICENSE`](LICENSE) at the repository
root. You may use, modify and redistribute it, including commercially, provided
the copyright notice travels with it.

Problem content is licensed separately in [`data/LICENSE`](data/LICENSE), with
the generated attribution record in [`data/NOTICE`](data/NOTICE). Those files
must stay with the corpus. **`data/NOTICE` is the authoritative record of what
the corpus contains and under what terms** — it is generated from the provenance
columns, so this README deliberately quotes no counts of its own; read the file.
Never copy LeetCode problem statements, and exclude any material whose licence
cannot be confirmed from its primary source. Creative Commons describes CC0 at
[creativecommons.org/public-domain/cc0](https://creativecommons.org/public-domain/cc0/).

Machine-drafted problems are recorded as machine-drafted and judge-verified.
The notice names no model: CC0 requires no attribution, and the claim that
matters is that the statements are original and every reference solution passed
the judge.

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
- **The API and the shell's decision logic have tests; the web app and judge
  do not.** 420 tests in the API, 46 in the desktop shell, all run in CI. What
  the shell's tests cover is what it *decides* — the escape hatch, the lock
  file, unlock-token binding, the watchdog, the kiosk guards. Whether Windows
  honours those decisions on real hardware is still unverified; see below.

### On tests

This repository previously carried 1219 Vitest tests across the API, web,
desktop and judge workspaces. The Vitest suites were removed at the owner's
explicit request; the API's coverage was later rebuilt against the Node test
runner and now stands at **420 tests**, run with:

    npm run test -w @codelock/api

The Electron shell now carries 46 of its own:

    npm run test -w @codelock/desktop

They cover the ten-second escape, the lock file and its twelve-hour backstop,
the rule that an unlock token only opens the session it was earned for, the
watchdog's fail-closed behaviour, and which shell events are intercepted while
locked. All of it is pure decision logic, which is deliberate — those modules
were written with no Electron imports so the thing deciding whether a machine
opens could be tested.

Two things remain uncovered. The web app and the judge have no tests. And no
test here touches Electron or Windows: the shell provably *decides* correctly,
and whether the operating system honours those decisions is the hardware gap
above, which automated tests on a Linux runner cannot close.

Also running automatically: `npm run typecheck` in each workspace, the
production builds, the Prisma migration check in CI,
`scripts/test-runtime-config.sh` (which asserts the web app's runtime API
origin and its CSP), and an advisory `npm audit`.
