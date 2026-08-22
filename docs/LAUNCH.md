# Launch runbook

Everything still standing between this repository and a working install on your
own devices, in the order it has to happen.

Steps marked **[you]** need credentials, hardware, money, or a decision that is
not mine to make. Everything not marked is already done.

Repository: `https://github.com/TommyDeLeon/codelock` — wired into the config
and set as the `origin` remote. **It does not exist on GitHub yet**; step 1
creates it.

---

## 1. Get the code onto GitHub **[you]**

The remote is configured but nothing has been pushed, and I did not create the
repository — publishing a codebase is your call, not something to do on your
behalf.

Create it at <https://github.com/new> named `codelock`, then:

```bash
git push -u origin main
```

Make it **public**. That is already the decision, and two things depend on it:
electron-updater cannot read releases from a private repository without a token,
and GitHub Container Registry is only free for public repos — which is what
makes the free deployment in [FREE-HOSTING.md](FREE-HOSTING.md) work.

Once pushed, CI runs on every commit: typecheck, tests, the 15 sandbox
containment checks, and the API image build.

## 2. Windows code signing **[you]**

Full commands in [`TRUSTED-INSTALL.md`](TRUSTED-INSTALL.md). The short version:

1. `New-SelfSignedCertificate` to create the key. Note the CN exactly.
2. Export the `.pfx` and the public `.cer` somewhere **outside this repository**.
3. In an **elevated** PowerShell, import the `.cer` into both
   `Cert:\LocalMachine\Root` and `Cert:\LocalMachine\TrustedPublisher` on each
   machine you install on. TrustedPublisher is the one that silences the prompt.
4. Record it in [`SIGNING-KEYS.md`](SIGNING-KEYS.md).

I did not run any of this. Creating a signing key and installing a trusted root
certificate change your machine's security posture — decisions to make, not to
have made for you.

Then tell CI about it:

```bash
gh variable set CODELOCK_PUBLISHER_CN --body "CodeLock"
```

```bash
gh secret set CSC_LINK --body "$(base64 -w0 /path/to/codelock-signing.pfx)"
```

```bash
gh secret set CSC_KEY_PASSWORD
```

`CODELOCK_PUBLISHER_CN` must match the certificate CN **exactly**. A mismatch
makes every Windows auto-update fail silently — no error, no dialog, no update,
ever.

Set the `REQUIRE_SIGNING` variable to `true` once signing works, and the release
workflow will refuse to publish an unsigned or untimestamped artifact.

## 3. Bake in the unlock key **[you]**

An installed shell that cannot verify an unlock token can never release a lock.
It warns at startup rather than discovering this at unlock time, but it is still
the fastest way to trap yourself.

```bash
gh secret set CODELOCK_UNLOCK_PUBLIC_KEY
```

```bash
gh variable set CODELOCK_WEB_URL --body "https://app.yourdomain"
```

For a self-hosted single user the simpler option is `CODELOCK_UNLOCK_SECRET`
matching the API's `JWT_UNLOCK_SECRET`, with the documented trade-off that
anyone who reads the installed app's config can mint their own unlock token.
Acceptable when the only user is you; not acceptable if you distribute the build.

## 4. Cut the first release **[you]**

```bash
git tag v0.1.0 && git push --tags
```

The release workflow runs the full suite first, then builds Windows, macOS and
Linux installers on their native runners, generates `SHA256SUMS.txt`, and opens
a **draft** release. Review it before publishing.

## 5. Prove auto-update end to end **[you]**

The one remaining item that decides whether your devices stay current, and it
cannot be faked locally.

1. Install `v0.1.0` on a real machine.
2. Bump the version, tag `v0.1.1`, publish that release.
3. Wait for the update check (six-hourly, or restart the app) and confirm it
   updates **without a prompt**.

If nothing happens, the two usual causes are a `publisherName` that does not
match the certificate CN, and a private repository with no token.

## 6. Deploy the server **[you]**

**No domain and no VPS? Use [`FREE-HOSTING.md`](FREE-HOSTING.md) instead of this
section.** It is a complete zero-cost path — an always-free VM, a free DuckDNS
hostname, and prebuilt images so the box never compiles anything — and it
explains why the judge rules out every free platform-as-a-service.

For a paid VPS with your own domain, the general guide is
[`DEPLOY.md`](DEPLOY.md). You need at least 2 GB RAM and two DNS A records —
`app.` and `api.` — resolving to it *before* you start, or Caddy cannot get
certificates.

```bash
git clone https://github.com/TommyDeLeon/codelock && cd codelock/deploy
```

```bash
cp .env.example .env && $EDITOR .env
```

```bash
./deploy.sh
```

`deploy.sh` validates the environment before compose starts anything: missing
values, leftover placeholders, secrets under 32 characters, and the three JWT
secrets being distinct.

Then, once, before you have data worth losing:

```bash
./restore.sh --latest
```

### A known platform difference

Grading does **not** work in the containerised stack on Docker Desktop for
Windows: the judge container's `/tmp` and the Docker daemon's `/tmp` are not the
same directory, so the bind-mounted source never reaches the sandbox and every
submission fails with `Cannot find module '/work/main.js'`.

On a Linux VPS — where the daemon and the judge container share one filesystem —
the assumption the compose file relies on does hold, so this is expected to work
on the deploy target. **It has not been confirmed there.** Check that one
submission grades before relying on it. If it does not, the fix is a named
volume with `volume-subpath` rather than a host path.

## 7. Mobile **[you]**

```bash
cd apps/mobile && npx eas init
```

That fills in the placeholder `extra.eas.projectId` in `app.json`. Then set
`extra.apiUrl` and `extra.webUrl` to your deployed hosts.

Android:

```bash
eas build --platform android --profile production-apk
```

**Back up the keystore before you build anything with it.** Losing it is the one
unrecoverable mistake in the whole project: every device with CodeLock installed
can never be updated again, only wiped and reinstalled.

iOS needs the paid Apple Developer Program ($99/yr) and your Apple ID in
`eas.json`, which still carries a placeholder. There is no free path — free
provisioning profiles expire in seven days. Given iOS cannot block another app
at all, this is reasonable to skip.

## 8. Loose ends **[you]**

| | |
|---|---|
| `NEXT_PUBLIC_CONTACT_EMAIL` | Unset, so no contact line renders. Publishing a personal address is your call. |
| `apps/mobile/eas.json` | `appleId` and `ascAppId` are placeholders. Only matter for App Store submission. |
| Legal review | `/privacy` and `/terms` are accurate drafts written from the code, not lawyer-reviewed. |
| Uptime monitoring | `/v1/health` exists for a monitor to poll. Nothing polls it. |
| Desktop escape matrix | [`ESCAPE-MATRIX.md`](ESCAPE-MATRIX.md) is reasoned through but not run on hardware. Worth an hour. |
| Android native code | Written and auto-linking, never compiled. Step 7 is the first time it is built. |

---

## What is already done

So the list above is not mistaken for the whole picture:

- Server-authoritative lock, speed gate, adaptive difficulty — with tests.
- Desktop lock survives a process kill, a crash, sleep, and a second monitor;
  documented kill switch (hold Escape for ten seconds).
- Android overlay service, boot receiver and persisted lock state — written and
  auto-linking, uncompiled.
- One-command VPS deploy with automatic TLS, nightly backups, and a **tested**
  restore.
- 15 sandbox containment checks, executable and green, gating every release.
- Unlock audit trail, admission control, rate limits, request ids, and optional
  error tracking that sends nothing unless configured.
- A public marketing site with a working demo that runs real code through the
  real judge and cannot issue an unlock token.
- 131 tests, zero type errors, all builds green.
