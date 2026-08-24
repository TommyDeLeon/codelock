# Hosting CodeLock for free

For a personal install you also want to share with a few people learning to
program. Total cost: **nothing**, and no card required on the recommended path.

---

## The thing that decides the architecture

Four pieces have to run: Postgres, the API, the web app, and the **judge**.

The judge is the constraint, and it is worth understanding before picking a
host. It grades a submission by starting a fresh Docker container per test case,
so it needs a real Docker daemon — not a container runtime someone else manages.
That rules out every free platform-as-a-service: Vercel, Netlify, Render,
Railway, Fly and Deno Deploy all run *your* code inside *their* sandbox, and
none will let you start sibling containers.

So: you need one small virtual machine you control. Everything else can go
somewhere free and managed, or onto the same box.

---

## Before you start: what needs an account

Three of the four steps need nothing but a terminal. Sign up for these first so
the runbook does not stall halfway.

| Needed for | Service | Account? | Card? |
|---|---|---|---|
| Step 0 — the VM | Oracle Cloud Always Free | **Yes** | Card for identity verification; not charged on Always Free |
| Step 1 — hostnames | DuckDNS | **Yes** (sign in with GitHub/Google/Twitter) | No |
| Step 1 — hostnames, alternative | sslip.io | No — no signup at all | No |
| Steps 2, 3, 4 | — | No | No |
| Optional — web on Vercel | Vercel Hobby | **Yes** | No |
| Optional — managed Postgres | Neon | **Yes** | No |

Everything CodeLock itself needs — secrets, certificates, the database — is
generated on the box by the scripts below. You are never asked to paste in a
credential from anywhere.

---

## Step 0 — Get the VM

**Oracle Cloud Always Free** gives an Ampere A1 (ARM) instance of up to 4 cores
and 24 GB RAM, free indefinitely rather than for twelve months. Far more than
CodeLock needs, and it runs the whole stack comfortably.

Two honest caveats:

- **A1 capacity is frequently unavailable** in popular regions. "Out of
  capacity" at signup is common; retrying over a few days, or choosing a quieter
  home region, usually works.
- It is **ARM**, so images must be arm64. The published ones are — every server
  image is built for `linux/amd64,linux/arm64`, and all five sandbox language
  images (`node`, `python`, `gcc`, `golang`, `eclipse-temurin`) publish arm64
  too. That was checked against the registry, not assumed.

### Fallbacks if A1 will not provision

| Option | Free for | Catch |
|---|---|---|
| Oracle AMD micro (2×) | Indefinitely | 1 GB RAM each. Set `JUDGE_CONCURRENCY=1`. |
| Google Cloud `e2-micro` | Indefinitely, one region | 1 GB RAM, shared vCPU. Tight but workable for one user. |
| AWS `t3.micro` | 12 months | Stops being free after a year. |

On any 1 GB box, put the web app on Vercel (below) rather than on the VM, and
drop `JUDGE_CONCURRENCY` to 1.

Note the VM's **public IP** before continuing. Step 1 needs it.

---

# The runbook

Steps 1 to 4, in order. Run every command; each one says what it should print
and how you know it went wrong. Nothing here assumes you have read anything
above.

---

## Step 1 — Two hostnames pointing at the VM

*Needs a DuckDNS account, or nothing at all if you use sslip.io.*

Caddy needs a real domain to obtain a Let's Encrypt certificate. A bare IP
address will not do — Let's Encrypt does not issue certificates for IPs.

At [DuckDNS](https://www.duckdns.org), sign in and create **two** subdomains,
both pointing at your VM's public IP:

```
codelock.duckdns.org        → your VM's public IP
codelock-api.duckdns.org    → the same IP
```

Both point at the same machine; Caddy routes by hostname, so one VM serves both.

**Check it worked.** From your laptop, not the VM:

```bash
dig +short codelock.duckdns.org
```

Should print your VM's public IP and nothing else:

```
203.0.113.10
```

**How you know it failed:** empty output means the record has not propagated or
was not saved — wait a minute and repeat. A *different* IP means you pasted the
wrong one; fix it now, because Caddy will ask Let's Encrypt to prove you control
that address and the certificate request will fail.

> No account at all: `sslip.io` resolves `203-0-113-10.sslip.io` to
> `203.0.113.10` with no signup. It works, but it is a shared domain that
> occasionally brushes Let's Encrypt rate limits, which is why DuckDNS is the
> recommendation.

---

## Step 2 — Open the ports

*No account needed. Run on the VM.*

There are two firewalls, and forgetting the second is the classic Oracle
mistake — the symptom is a deploy that completes cleanly and a site that never
responds.

**First**, in the cloud console, add ingress rules allowing TCP **80** and
**443** from `0.0.0.0/0`.

**Second**, on the VM itself, because Oracle's images ship with a restrictive
`iptables`:

```bash
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
```

```bash
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
```

```bash
sudo netfilter-persistent save
```

The last one should print:

```
run-parts: executing /usr/share/netfilter-persistent/plugins.d/15-ip4tables save
run-parts: executing /usr/share/netfilter-persistent/plugins.d/25-ip6tables save
```

**Check it worked:**

```bash
sudo iptables -L INPUT -n --line-numbers | head -12
```

You should see your two `ACCEPT ... tcp dpt:80` and `dpt:443` rules listed
*above* any `REJECT` line. Order matters: a rule below the `REJECT` never runs.

**How you know it failed:** if `netfilter-persistent` is not installed, the save
command prints `command not found` and your rules vanish on reboot. Install it
with `sudo apt install iptables-persistent`, then save again.

---

## Step 3 — Install Docker

*No account needed. Run on the VM.*

```bash
curl -fsSL https://get.docker.com | sh
```

Ends with a version banner naming the installed release.

```bash
sudo usermod -aG docker $USER
```

Prints nothing. That is success.

Now **log out and back in** — group membership is only read at login, and
without doing this every later command fails with `permission denied while
trying to connect to the Docker daemon socket`.

**Check it worked:**

```bash
docker run --rm hello-world
```

Should print `Hello from Docker!` and a short explanation.

**How you know it failed:** `permission denied ... docker.sock` means you did
not log out and back in. `Cannot connect to the Docker daemon` means the service
is not running — `sudo systemctl enable --now docker`.

---

## Step 4 — Deploy

*No account needed. Run on the VM.*

### 4a. Get the code

```bash
git clone https://github.com/TommyDeLeon/codelock && cd codelock/deploy
```

### 4b. Generate the secrets

```bash
./gen-secrets.sh
```

Prints:

```
Wrote deploy/.env with fresh secrets (mode 600).

Still to fill in by hand:
  APP_DOMAIN       the hostname serving the web app
  API_DOMAIN       the hostname serving the API
  TLS_EMAIL        where Let's Encrypt sends expiry warnings
```

That writes `.env` containing fresh 64-character values for the three JWT keys,
the encryption key and the database password, and leaves blank everything it
cannot know. The values are URL-safe on purpose: the database password is
interpolated straight into `DATABASE_URL`, and a `/` in it silently produces a
*different, invalid* URL rather than a wrong password.

**How you know it failed:** `.env already exists. Refusing to overwrite it.` means
you have run this before. That refusal is deliberate — regenerating
`JWT_UNLOCK_SECRET` invalidates every unlock token already issued, and
regenerating `ENCRYPTION_KEY` makes stored integration credentials permanently
undecryptable. If you genuinely want fresh secrets, delete `.env` first and
accept both consequences.

### 4c. Fill in the three things only you know

```bash
nano .env
```

Set exactly these:

```
APP_DOMAIN=codelock.duckdns.org
API_DOMAIN=codelock-api.duckdns.org
TLS_EMAIL=you@your-real-address.com
```

Use the two hostnames from Step 1 and an address you actually read — it is where
Let's Encrypt sends expiry warnings. `GITHUB_CLIENT_ID` and
`GITHUB_CLIENT_SECRET` are optional and only power the GitHub mirroring
integration; leave them blank.

### 4d. Start it

Using the prebuilt images, so the VM never has to build a Next.js bundle:

```bash
docker compose -f docker-compose.yml -f docker-compose.ghcr.yml up -d --wait
```

`--wait` blocks until every service with a health check reports healthy, so this
command succeeding means the stack genuinely came up rather than that it was
still starting. Success ends with each container listed as `Healthy`:

```
 Container codelock-postgres-1  Healthy
 Container codelock-api-1       Healthy
 Container codelock-web-1       Healthy
 Container codelock-judge-1     Healthy
 Container codelock-caddy-1     Healthy
 Container codelock-backup-1    Healthy
```

**How you know it failed:** the command ends with
`container codelock-<name>-1 is unhealthy`. Read that container's log —
`docker compose logs api --tail 40` — before changing anything. Two failures
worth recognising:

- `P1013: The provided database string is invalid` — the database password
  contains a character that breaks a URL. `./deploy.sh` refuses to start on
  this; if you edited `.env` by hand, regenerate the password URL-safely with
  `openssl rand -base64 48 | tr -d '\n=' | tr '+/' '-_' | cut -c1-64`.
- `Missing in deploy/.env` or `Still set to the example value` — a required
  value is blank or still contains `example`. A placeholder domain produces a
  stack that starts and can never get a certificate.

> Building on the box with plain `./deploy.sh` also works if you have the
> 4-core A1, and runs the same preflight checks. On a 1 GB instance it will be
> OOM-killed part-way through the web build — use the prebuilt images above.

### 4e. Confirm the API is alive

```bash
curl https://codelock-api.duckdns.org/v1/health
```

```json
{"ok":true,"database":"up","latencyMs":40}
```

**How you know it failed:** `"database":"down"` means the API is up but cannot
reach Postgres. A TLS error or a hang usually means Step 1 or Step 2 — the
certificate is provisioned on the first request and can take a minute, so retry
once before assuming the worst. `curl: (7) Failed to connect` on port 443 is
the firewall.

### 4f. Confirm grading actually works

This is the one thing to check by hand, because it is the only part that
depends on the host's own Docker setup:

```bash
curl -X POST https://codelock-api.duckdns.org/v1/demo/grade -H 'content-type: application/json' -d '{"language":"JAVASCRIPT","sourceCode":"console.log(1)"}'
```

A JSON verdict means the sandbox works.

**How you know it failed:** `Cannot find module '/work/main.js'` means the judge
container and the Docker daemon disagree about paths — see the note in
[`LAUNCH.md`](LAUNCH.md). That has only shown up on Docker Desktop for Windows,
not on Linux. A long hang on the first call in a language is the image
downloading; `docker compose exec judge node dist/pull-images.js` pre-pulls them
all.

### 4g. Prove you can restore a backup

Do this **once, now**, before you have anything worth losing. A backup nobody
has restored is a rumour about a backup.

```bash
./restore.sh --list
```

Lists the dumps held, newest first:

```
codelock-20260824T011527Z.sql.gz
```

If it prints nothing, no backup has run yet — the first is written at 03:00 UTC.

```bash
./restore.sh --latest
```

It tells you what it is about to do and waits. Type `restore` and press enter;
anything else aborts. It stops the API, drops and recreates the database, loads
the dump, and starts the API again. It ends with:

```
Restored codelock-20260824T011527Z.sql.gz.
```

**How you know it failed:** the restore drops the database *before* loading, so
a failure part-way leaves you with an empty one. That is exactly why this drill
happens now, on an install with nothing in it, rather than the first time you
need it.

**That is the whole deployment.** Caddy provisions certificates on first
request, the API applies its migrations at boot, and nightly backups start
immediately.

---

## Optional: web app on Vercel instead

Worth doing on a 1 GB instance, or if you want the site fast worldwide.
Vercel's Hobby tier is free for non-commercial use. **Needs a Vercel account.**

Import the repo at [vercel.com/new](https://vercel.com/new). The root
`vercel.json` already sets the build command and the security headers. Add two
environment variables:

```
NEXT_PUBLIC_API_URL   = https://codelock-api.duckdns.org
NEXT_PUBLIC_SITE_URL  = https://your-project.vercel.app
```

`NEXT_PUBLIC_SITE_URL` is the one that has to be right at **build** time. It
becomes `metadataBase`, which is what makes Open Graph image URLs absolute, and
those tags are baked into the statically rendered pages. Get it wrong and every
shared link previews a broken image, with nothing failing anywhere to tell you.

`NEXT_PUBLIC_API_URL` is more forgiving than it used to be: the
Content-Security-Policy is now built per request in `middleware.ts`, so
`connect-src` follows whatever origin the running server is configured with
rather than whatever was compiled in. On the Docker path that origin comes from
`CODELOCK_API_URL` at run time, which is why one prebuilt image works for any
deployment.

Then set `APP_DOMAIN` on the VM to your Vercel hostname so CORS matches, and
drop the `web` service from the stack if you like.

## Optional: Postgres somewhere managed

The bundled Postgres is fine and is backed up nightly. If you would rather not
run a database at all, [Neon](https://neon.tech) has a genuinely persistent free
tier — point `DATABASE_URL` at its connection string and remove the `postgres`
and `backup` services. **Needs a Neon account.** Note that free Postgres on
**Render** is deleted after 30 days, which is not a useful property for
something holding your history.

---

## Keeping it updated

Every push to `main` rebuilds and republishes the images. On the VM:

```bash
docker compose -f docker-compose.yml -f docker-compose.ghcr.yml pull
```

```bash
docker compose -f docker-compose.yml -f docker-compose.ghcr.yml up -d --wait
```

Pin `IMAGE_TAG` in `.env` to something like `v0.1.0` if you would rather update
deliberately than track `latest`.

---

## What "free" costs you in limits

Being straight about it:

- **One judge, and a small one.** The API queues grading at
  `GRADE_CONCURRENCY` (default 4) and refuses past 20 waiting; the judge worker
  runs `JUDGE_CONCURRENCY` containers at once (default 4, and the one you lower
  on a 1 GB box). A handful of learners submitting at once is fine; a classroom
  of thirty is not.
- **The demo is capped at 5 runs a minute per IP.** Deliberate — it is the only
  unauthenticated endpoint that executes code, and free hosting is exactly the
  situation where that matters.
- **Oracle reclaims genuinely idle Always Free instances.** Anything running a
  database and a web server does not qualify, but do not stop the VM for weeks
  and expect it back.
- **Nothing watches whether it is up.** `/v1/health` exists for a monitor to
  poll; [UptimeRobot](https://uptimerobot.com) is free and would tell you when
  it is down, which for a lock app is worth having.
