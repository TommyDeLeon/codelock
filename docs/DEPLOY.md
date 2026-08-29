# Deploying CodeLock

One VPS runs the whole thing: Postgres, the API, the sandbox, the web app, and
Caddy terminating TLS in front. Everything below assumes a fresh Debian or
Ubuntu box you control.

For a zero-cost setup, see [FREE-HOSTING.md](FREE-HOSTING.md) instead — the
judge needs a Docker socket, which no free platform-as-a-service grants.

Running it only for yourself, on the Windows machine you sit at? Skip all of
this and see **Running the backend locally (Windows)** at the end.

---

## What you need first

- A VPS with **2 GB RAM minimum**. The sandbox gives each concurrent submission
  its own container with a full core; 1 GB works for a single user but the
  first C++ or Java submission will be tight.
- Two DNS A records pointed at its public IP, e.g. `app.example.com` and
  `api.example.com`. Both must resolve **before** you start, or Caddy cannot
  get certificates.
- Docker:

```bash
curl -fsSL https://get.docker.com | sh
```

## Deploy

```bash
git clone <your-fork> codelock && cd codelock/deploy
```

```bash
cp .env.example .env
```

Fill in `.env`. Generate each secret **separately** — the API refuses to boot
in production if any two match:

```bash
openssl rand -base64 48
```

Then:

```bash
./deploy.sh
```

The script checks the environment before compose starts anything: missing
values, leftover placeholders, secrets shorter than 32 characters, and the
three JWT secrets being distinct. A lock app misconfigured means either
"nobody can unlock" or "everybody can", and neither should be discovered from a
crash-looping container behind a 502.

It then builds, waits for every healthcheck to pass, and pre-pulls the sandbox
language images. That last step matters: without it the first submission in
each language pays the image download inside the grading request, which looks
exactly like a hung judge.

TLS certificates are provisioned on the first request and can take a minute.

## Migrations

The API image runs `prisma migrate deploy` at boot, before it serves anything.
Not `db push` — `db push` diffs the live database against the schema and applies
whatever it thinks is needed, which on a production database can silently drop
a column. `migrate deploy` applies the migration files in the repo and refuses
to run anything not recorded there.

CI also runs `migrate deploy` against a scratch database on every push, so a
migration that has drifted from the schema fails there rather than in
production.

## Updating

```bash
git pull && ./deploy.sh
```

Compose rebuilds only what changed. The API runs pending migrations on the way
up.

## Backups

A `backup` container takes a `pg_dump` immediately on deploy and then nightly
at 03:00 UTC, gzipped into a named volume, with 14 days of retention
(`BACKUP_RETENTION_DAYS`). It writes to `.partial` first and renames on
success — a dump interrupted halfway would otherwise sit in the directory
looking exactly like a good one, and you would find out on the day you needed
it.

```bash
./restore.sh --list
```

**Do a restore drill once, now, before you have data worth losing.** A backup
nobody has restored is a rumour about a backup:

```bash
./restore.sh --latest
```

It drops and recreates the database, so do it on the day you deploy rather than
six months in. It asks you to type `restore` first.

To copy dumps off the box:

```bash
docker compose cp backup:/backups ./backups-local
```

Do that on a schedule you actually keep. A backup on the same disk as the
database protects you from a bad migration, not from losing the VPS.

---

## The Docker socket, and what it costs

`deploy/docker-compose.yml` mounts `/var/run/docker.sock` into the judge
container. This is the single biggest trade-off in the deployment and it is
worth being blunt about:

**Access to the Docker socket is root-equivalent on the host.** Anyone who
compromises the judge process can start a privileged container and own the
box — the sandboxing around submitted code is irrelevant at that point,
because they are already outside it.

Why it is there: the judge spawns a sibling container per submission. The
alternative, Judge0, sandboxes with `isolate`, which needs cgroup v1 —
unavailable on Docker Desktop and on most current distros.

What to do about it, in increasing order of effort:

1. **Run CodeLock on a dedicated VPS.** If the box does nothing else, the blast
   radius is a box you can rebuild. For a personal deployment this is the
   proportionate answer, and it is what this compose file assumes.
2. **Put a socket proxy in front.** Something like `tecnativa/docker-socket-proxy`
   restricted to `container create/start/wait/remove` removes most of the
   privilege while keeping the judge working.
3. **Add a second boundary.** `--runtime=runsc` (gVisor) or Kata Containers if
   you are taking submissions from people you do not know.

The judge has **no authentication by design** and must never be published. In
this compose file only Caddy binds a host port; the judge is reachable solely
from inside the compose network. Do not add a `ports:` entry to it.

---

## Health

| Endpoint | Answers |
|---|---|
| `GET /healthz` | The process is up. Says nothing about whether it can serve. |
| `GET /readyz` | Postgres is reachable. Used for zero-downtime rollouts. |
| `GET /v1/health` | Same check, but shaped for clients. Unauthenticated on purpose — a client that cannot authenticate still needs to know why. |

```bash
curl https://api.example.com/v1/health
```

The web app polls the last one and shows an app-wide banner when it fails, so
an outage never renders as "you have no active session".

## Logs

```bash
docker compose logs -f api
```

```bash
docker compose logs -f judge
```

## Environment reference

Every variable, what it does, and what breaks without it, is in
`deploy/.env.example`. The API validates its own environment at boot with a
schema and prints exactly which variable is wrong; the judge does the same for
its numeric settings, because `Number('four')` is `NaN` rather than an error
and a `NaN` concurrency makes the service look hung rather than misconfigured.

---

## Running the backend locally (Windows)

For a single user on their own machine, with the desktop app installed via
[`apps/desktop/scripts/install-local.ps1`](../apps/desktop/scripts/install-local.ps1).
No VPS, no DNS, no TLS.

The desktop app is set to start at login, and a lock it cannot verify an
unlock against is the worst state this product has: the timer fires, the
overlay appears, and a correct solution cannot open the machine. So the
backend has to come up at login too, and before the user needs it.

```powershell
npm run build
.\scripts\serve-local.ps1
```

That starts Postgres (`codelock-pg`), then the API on :4000, the web app on
:3000, and the judge on :2358 — all from built output, not dev servers. It
skips any port already listening, so it is safe to run repeatedly.

```powershell
.\scripts\serve-local.ps1 -Status   # what is up
.\scripts\serve-local.ps1 -Stop     # stop the three Node services
```

Logs land in `%LOCALAPPDATA%\CodeLock\logs\` as `api.log`, `web.log`,
`judge.log`, with `.err.log` siblings.

### Letting the app start the backend

The desktop app can bring the services up itself, so opening CodeLock is enough
and no terminal is involved. Add a `backendCommand` to
`%APPDATA%\CodeLock\config.json`:

```json
{
  "webUrl": "http://localhost:3000",
  "apiUrl": "http://localhost:4000",
  "backendCommand": "powershell.exe -NoProfile -ExecutionPolicy Bypass -File D:\\Cowork\\codelock\\scripts\\serve-local.ps1"
}
```

It runs only when `GET {apiUrl}/healthz` does not answer, so a second window —
or a machine where the Scheduled Task below already handles this — starts
nothing. It is empty by default and has no environment-variable override: a
command executed at startup should be something written deliberately into a
config file, not something a stray variable in the launching shell can inject.
The process is detached, so closing the window to the tray does not take the
backend down with it.

This does not replace the Scheduled Task. The app covers "I opened CodeLock";
the task covers "the machine has been on since login and the app is closed",
which is exactly when a timer can expire with nothing watching.

### At logon, and every five minutes

The desktop app is a 24/7 background process, so the backend has to be one too.
A logon trigger alone is not enough: a service that dies at midday stays dead
until the next reboot, and the failure lands at the worst possible moment. The
unlock token is verified locally against the shared secret, so a dead API
cannot forge a lock open — but *earning* the token means submitting a solution
to be graded, and that needs the API and the judge. Lose them mid-session and
the screen stays locked with only the kill switch as a way out.

`serve-local.ps1` skips ports that are already listening, so re-running it is
cheap and restarts only what actually died. Register it with two triggers: one
at logon, one repeating every five minutes.

Note the repetition has to be written as XML. `New-ScheduledTaskTrigger -Once
-RepetitionInterval` needs a `RepetitionDuration`, and Task Scheduler rejects
`[TimeSpan]::MaxValue` as out of range; an omitted `<Duration>` in the XML is
what actually means "indefinitely".

```powershell
$user = "$env:USERDOMAIN\$env:USERNAME"
$xml = @"
<Task version="1.4" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <Triggers>
    <LogonTrigger><Enabled>true</Enabled><UserId>$user</UserId><Delay>PT30S</Delay></LogonTrigger>
    <TimeTrigger>
      <Enabled>true</Enabled>
      <StartBoundary>2026-01-01T00:00:00</StartBoundary>
      <Repetition><Interval>PT5M</Interval><StopAtDurationEnd>false</StopAtDurationEnd></Repetition>
    </TimeTrigger>
  </Triggers>
  <Principals><Principal id="Author"><UserId>$user</UserId><LogonType>InteractiveToken</LogonType><RunLevel>LeastPrivilege</RunLevel></Principal></Principals>
  <Settings>
    <MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy>
    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>
    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>
    <StartWhenAvailable>true</StartWhenAvailable>
    <ExecutionTimeLimit>PT10M</ExecutionTimeLimit>
    <Enabled>true</Enabled>
  </Settings>
  <Actions Context="Author">
    <Exec>
      <Command>C:\Windows\System32\conhost.exe</Command>
      <Arguments>--headless powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "&lt;repo&gt;\scripts\serve-local.ps1"</Arguments>
    </Exec>
  </Actions>
</Task>
"@
Register-ScheduledTask -TaskName 'CodeLock Backend' -Xml $xml -User $user
```

Three details that are not obvious, each learned the hard way:

**Run it through `conhost --headless`, not `powershell.exe` directly.**
`powershell.exe -WindowStyle Hidden` does *not* suppress the console when Task
Scheduler launches it with an interactive token — a window flashes up every
five minutes, forever, which is intolerable for a task that exists to be
invisible. `conhost --headless` allocates a pseudoconsole with no window at
all. The usual advice is to set the principal's `LogonType` to `S4U` instead,
which also runs windowless; that requires administrator rights to register, so
`conhost` is the option that works from an ordinary shell.

**`Register-ScheduledTask -User` overrides the XML principal.** Passing `-User`
silently rewrites `LogonType` back to `InteractiveToken`, so an S4U principal
in the XML is discarded without an error. Omit `-User` if the XML's principal
is what you want.

**`MultipleInstancesPolicy = IgnoreNew`** stops a slow run — one waiting on
Docker — from overlapping the next five-minute tick.

Verify it heals rather than trusting that it does. Kill a service and watch it
come back:

```powershell
Stop-Process -Id (Get-NetTCPConnection -LocalPort 4000 -State Listen).OwningProcess -Force
Start-ScheduledTask -TaskName 'CodeLock Backend'
.\scripts\serve-local.ps1 -Status
```

The older, logon-only registration, if that is all you want:

```powershell
$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument '-NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File "<repo>\scripts\serve-local.ps1"'
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
$trigger.Delay = 'PT30S'
Register-ScheduledTask -TaskName 'CodeLock Backend' -Action $action -Trigger $trigger -Settings (New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -ExecutionTimeLimit ([TimeSpan]::Zero))
```

Give the container a restart policy too, so a reboot brings it back without
the script having to:

```powershell
docker update --restart unless-stopped codelock-pg
```

The 30-second delay and the script's own three-minute wait both exist for
Docker Desktop, which starts at login but is not ready when the task fires.
Without the wait, the API boots against a database that is not accepting
connections and exits.

Remove it all with:

```powershell
Unregister-ScheduledTask -TaskName 'CodeLock Backend' -Confirm:$false
```

### Limits of this setup

Nothing here is hardened. The services bind localhost with no TLS, the judge
holds the same root-equivalent Docker socket described above, and there are no
backups — see **Backups** for what you would lose. It is a workstation
configuration for one person, not a deployment.
