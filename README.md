# CodeLock

CodeLock is a private, single-user commitment app. When a focus timer expires,
it presents a programming problem and keeps the supported lock client in front
until the submitted solution passes the tests and meets the configured runtime
budget.

The current product is designed for one person on one computer, with optional
mobile access over a trusted private network. It has no account system and the
API does not authenticate requests. Keep every service off the public internet.

## Current architecture

| Path | Responsibility | Current state |
|---|---|---|
| `apps/web` | Next.js dashboard, problem workspace, learning log, privacy, and terms | Runs locally in a browser and supplies the UI used by the desktop shell |
| `apps/api` | Node 24, Express, Prisma, Postgres, timers, grading, progress, hints, and unlock proofs | Uses one automatically created local learner; no login or OAuth routes |
| `apps/judge` | Judge0-compatible service that starts one temporary Docker container per submission | Bundled and local; no hosted judge or API key |
| `apps/desktop` | Electron dashboard and lock shell | Windows behavior has been exercised; other desktop targets remain unverified |
| `apps/mobile` | Expo client and native lock module | Android native source is unverified on a device; iOS hard locking is unsupported |
| `packages/shared` | Shared API types | Imported by the clients and server |

Postgres remains the source of truth for timers, lock sessions, submissions,
progress, and learning history. Old account and integration columns remain in
the migration history to preserve existing databases, but the current runtime
does not expose account, password, OAuth, GitHub, or LeetCode features.

## No metered APIs

The supported runtime uses the bundled judge at `http://127.0.0.1:2358` during
direct local development or `http://judge:2358` inside Docker Compose. The API
rejects remote judge URLs. Problem selection is local and deterministic; no
OpenAI request is made. Sentry and the former hosted integrations are absent
from the runtime.

This prevents CodeLock itself from creating new usage on those services. It
does not cancel accounts or subscriptions created for an older setup. To avoid
unexpected charges, sign in to every provider you previously used and:

1. Revoke API keys and OAuth applications.
2. Stop and delete deployed services, databases, storage, and monitoring.
3. Cancel paid plans and remove saved payment methods where the provider allows it.
4. Check the billing page for pending usage or a final invoice.
5. Save the cancellation confirmation, then close the account if it is no longer needed.

Relevant account pages include [RapidAPI billing](https://rapidapi.com/developer/billing),
[OpenAI API billing](https://platform.openai.com/settings/organization/billing/overview),
[Sentry billing](https://sentry.io/settings/billing/),
[Render billing](https://dashboard.render.com/billing),
[Vercel billing](https://vercel.com/docs/accounts/plans-and-billing), and
[Neon billing](https://neon.com/docs/introduction/billing). Provider interfaces
and cancellation rules can change, so verify completion on the provider itself.

## Local setup

You need [Node.js 24](https://nodejs.org/en/download),
[Docker Desktop](https://docs.docker.com/desktop/), and Git.

Install the JavaScript dependencies:

```powershell
npm.cmd install
```

Copy the environment templates:

```powershell
Copy-Item apps/api/.env.example apps/api/.env
Copy-Item apps/web/.env.example apps/web/.env.local
```

Generate one unlock-signing secret of at least 32 characters and put it in
`apps/api/.env` as `JWT_UNLOCK_SECRET`. One PowerShell option is:

```powershell
[Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(48))
```

Do not commit the filled environment file. The Compose stack supplies its own
internal database and judge addresses, so the remaining template defaults are
appropriate for local use.

Build and start the complete local stack:

```powershell
docker compose up --build
```

The web app is available at [http://127.0.0.1:3000](http://127.0.0.1:3000).
On the first start, Docker may need to download Postgres and language images.
That network traffic is an image download, not a metered CodeLock API call.

Initialize or refresh the database schema and authored problem set from a
second terminal:

```powershell
npm.cmd run db:reset
```

Calibrate the runtime gate on the same judge and hardware that will grade
submissions:

```powershell
npm.cmd run calibrate -- --write
```

Calibration matters because runtime measurements include hardware and container
noise. A budget measured on a faster machine can reject an appropriate solution
on a slower one.

Stop the stack without deleting its Postgres volume:

```powershell
docker compose down
```

## Running individual applications

For active development, start the database and judge, then run these in separate
terminals:

```powershell
npm.cmd run dev:judge
npm.cmd run dev:api
npm.cmd run dev:web
```

Start the Electron shell after the web app and API are available:

```powershell
npm.cmd run dev:desktop
```

To exercise the lock screen without waiting for a timer, arm a focus session,
then run the development-only expiry helper:

```powershell
npm.cmd run dev:expire
```

That helper writes to the local database and is not exposed as an API route.

## Mobile on a trusted private network

The API and web service bind to loopback by default. That is the safe desktop
default, but a phone cannot reach another computer&apos;s loopback interface. For a
mobile development build, deliberately bind the web and API services to the
computer&apos;s private LAN address, set the mobile API and web URLs to that address,
allow only the private subnet through the host firewall, and return to loopback
when finished. Do not use router port forwarding, a public tunnel, or a public
cloud deployment: the API has no caller authentication.

Expo Go cannot load the Android overlay module. Android requires a native
development build:

```powershell
npm.cmd run prebuild -w @codelock/mobile
npm.cmd run android -w @codelock/mobile
```

Android asks the user to allow notifications, display over other apps, and a
battery-optimization exemption. The source includes a foreground overlay
service and reboot recovery, but this repository&apos;s recorded state has not
verified them on a real device. Force-stop, Safe Mode, uninstall, revoked
permissions, and manufacturer battery controls can still defeat the overlay.

The iOS module intentionally reports hard locking as unsupported. Apple&apos;s
[Family Controls framework](https://developer.apple.com/documentation/familycontrols)
uses restricted entitlements and is not implemented here. The browser route is
also advisory because its tab can be closed.

## Unlock and grading rules

The server chooses a problem when a timer fires. A submission unlocks the held
session only when every test passes and its measured runtime falls within:

```text
best known runtime × PERF_TOLERANCE + PERF_FLOOR_MS
```

The defaults use a tolerance of `1.35`, a `40 ms` noise floor, and the fastest
of two timed runs. Reference runtimes are stored per language because startup
and compilation costs differ. Raise the settings deliberately if the gate is
too strict; recalibrate after changing the judge, language images, or hardware.

The API signs an unlock proof with `JWT_UNLOCK_SECRET` and binds it to the held
session. The Electron main process validates that proof before releasing its
window. This protects the normal application path, but it cannot withstand an
administrator who changes the program or database.

## Security boundaries

CodeLock is a commitment device, not a hardened security product.

- The API has rate limits, request-size limits, CORS checks, and loopback binding,
  but it has no authentication. CORS is a browser control and does not stop a
  direct HTTP client.
- Submitted code runs in temporary containers with networking disabled, a
  read-only filesystem, dropped Linux capabilities, a non-root user, and CPU,
  memory, process, and temporary-storage limits.
- The judge reaches the Docker daemon to create those containers. Docker socket
  access is effectively host-administrator access if the judge process is
  compromised. Keep it private and run only code you are prepared to execute on
  your machine.
- Windows user-space locking cannot intercept Ctrl+Alt+Del or survive power-off,
  another operating system, administrator intervention, or removal of the app.
- Windows signing and automatic updating have not been verified end to end.
  macOS and Linux packaging and lock behavior have not been verified on those
  platforms.

Docker documents its daemon security model in
[Docker daemon attack surface](https://docs.docker.com/engine/security/#docker-daemon-attack-surface),
and OWASP explains why CORS is not authentication in its
[REST Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html).

No review can promise that software is free of every vulnerability or legal
risk. The repository should be reassessed before public, commercial, shared, or
safety-critical use.

## Data, privacy, and removal

The database stores the local profile and preferences, focus and lock sessions,
submitted source code, verdicts, runtimes, progress, hints, debriefs, and the
learning log. Requests are logged locally with sensitive request bodies and
authorization headers redacted. There is no account-deletion screen because
there is no account.

To erase application data, remove the CodeLock Postgres database or Docker
volume, any separately copied backups, and CodeLock client storage on each
device. Inspect the exact volume first: deletion is irreversible. See the
in-app `/privacy` and `/terms` pages for the current user-facing notices.

## Licensing and corpus provenance

This repository does not currently contain a general software licence. Access
to the source does not by itself grant permission to copy, modify, or
redistribute it. Add a deliberate root licence before describing the code as
open source or accepting outside reuse.

Problem content has separate terms in [`data/LICENSE`](data/LICENSE), with the
generated attribution record in [`data/NOTICE`](data/NOTICE). Those legal files
must remain with the corpus. The authored problem definitions currently live
under `apps/api/src/corpus/problems`; the `data/` directory holds the corpus
licence and notice rather than all corpus text.

The current notice records 728 CodeLock-authored problems under CC0. Keep that
claim only while provenance review supports it. Never copy LeetCode problem
statements, and exclude material whose licence cannot be confirmed from its
primary source. Creative Commons explains CC0 at
[creativecommons.org/public-domain/cc0](https://creativecommons.org/public-domain/cc0/).

## Packaging status

Electron build configuration exists for Windows, macOS, and Linux. A local
unsigned Windows package has been built, but Windows Smart App Control and
SmartScreen may block an unsigned installer. Local certificate creation,
trusted installation, production signing, and automatic update from one
released version to another have not been completed as an end-to-end check.
macOS and Linux artifacts have not been verified on matching hardware.

Android release signing needs a stable keystore; losing it can prevent an
installed direct-distribution build from accepting later updates. iOS device
distribution normally requires Apple&apos;s developer services. Consult the current
[Android app-signing guidance](https://developer.android.com/studio/publish/app-signing)
and [Apple code-signing overview](https://developer.apple.com/support/code-signing/)
before producing release builds.
