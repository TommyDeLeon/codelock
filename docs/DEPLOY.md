# Deploying CodeLock

One VPS runs the whole thing: Postgres, the API, the sandbox, the web app, and
Caddy terminating TLS in front. Everything below assumes a fresh Debian or
Ubuntu box you control.

For a zero-cost setup, see [FREE-HOSTING.md](FREE-HOSTING.md) instead — the
judge needs a Docker socket, which no free platform-as-a-service grants.

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
