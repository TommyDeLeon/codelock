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

## Recommended: one always-free VM

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

---

## Step 1 — Get a hostname, free

Caddy needs a real domain to obtain a Let's Encrypt certificate. An IP address
will not do.

[DuckDNS](https://www.duckdns.org) gives you `something.duckdns.org` free,
forever, with no card. Create two:

```
codelock.duckdns.org        → your VM's public IP
codelock-api.duckdns.org    → the same IP
```

Both point at the same machine; Caddy routes by hostname.

`sslip.io` and `nip.io` also work with no signup at all — `1-2-3-4.sslip.io`
resolves to `1.2.3.4` — but they are shared domains that occasionally brush
Let's Encrypt rate limits. DuckDNS is the safer choice.

## Step 2 — Open the ports

Two firewalls, and forgetting the second is the classic Oracle mistake.

In the cloud console, add ingress rules for TCP **80** and **443**. Then on the
VM itself, because Oracle's images ship with a restrictive `iptables`:

```bash
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
```

```bash
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
```

```bash
sudo netfilter-persistent save
```

## Step 3 — Install Docker

```bash
curl -fsSL https://get.docker.com | sh && sudo usermod -aG docker $USER
```

Log out and back in so the group membership applies.

## Step 4 — Deploy

```bash
git clone https://github.com/TommyDeLeon/codelock && cd codelock/deploy
```

```bash
cp .env.example .env && nano .env
```

Set `APP_DOMAIN` and `API_DOMAIN` to your DuckDNS names, `TLS_EMAIL` to a real
address, and generate each secret separately:

```bash
openssl rand -base64 48
```

Then start it **using the prebuilt images**, so the VM never has to build a
Next.js bundle:

```bash
docker compose -f docker-compose.yml -f docker-compose.ghcr.yml up -d --wait
```

That is the whole deployment. Caddy provisions certificates on the first
request, the API applies its migrations at boot, and nightly backups begin
immediately.

> Building on the box with plain `./deploy.sh` also works if you have the
> 4-core A1, and is simpler. On a 1 GB instance it will be OOM-killed part-way
> through the web build.

### Confirm grading actually works

The one thing to check by hand, because it is the only part that depends on the
host's Docker setup:

```bash
curl -X POST https://codelock-api.duckdns.org/v1/demo/grade -H 'content-type: application/json' -d '{"language":"JAVASCRIPT","sourceCode":"console.log(1)"}'
```

A JSON verdict means the sandbox works. `Cannot find module '/work/main.js'`
means the judge container and the Docker daemon disagree about paths — see the
note in [`LAUNCH.md`](LAUNCH.md). That has only shown up on Docker Desktop for
Windows, not on Linux.

---

## Optional: web app on Vercel instead

Worth doing on a 1 GB instance, or if you want the site fast worldwide.
Vercel's Hobby tier is free for non-commercial use.

Import the repo at [vercel.com/new](https://vercel.com/new). The root
`vercel.json` already sets the build command and the security headers. Add two
environment variables:

```
NEXT_PUBLIC_API_URL   = https://codelock-api.duckdns.org
NEXT_PUBLIC_SITE_URL  = https://your-project.vercel.app
```

`NEXT_PUBLIC_API_URL` matters more than it looks: the Content-Security-Policy is
generated from it at build time, so if it is wrong the browser blocks every API
call and the only clue is a console warning.

Then set `APP_DOMAIN` on the VM to your Vercel hostname so CORS matches, and
drop the `web` service from the stack if you like.

## Optional: Postgres somewhere managed

The bundled Postgres is fine and is backed up nightly. If you would rather not
run a database at all, [Neon](https://neon.tech) has a genuinely persistent free
tier — point `DATABASE_URL` at its connection string and remove the `postgres`
and `backup` services. Note that free Postgres on **Render** is deleted after
30 days, which is not a useful property for something holding your history.

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

- **One judge, and a small one.** Concurrent grading is capped by
  `GRADE_CONCURRENCY` (default 4) and the queue refuses past 20 waiting. A
  handful of learners submitting at once is fine; a classroom of thirty is not.
- **The demo is capped at 5 runs a minute per IP.** Deliberate — it is the only
  unauthenticated endpoint that executes code, and free hosting is exactly the
  situation where that matters.
- **Oracle reclaims genuinely idle Always Free instances.** Anything running a
  database and a web server does not qualify, but do not stop the VM for weeks
  and expect it back.
- **Nothing watches whether it is up.** `/v1/health` exists for a monitor to
  poll; [UptimeRobot](https://uptimerobot.com) is free and would tell you when
  it is down, which for a lock app is worth having.
