# Release guide — CodeLock desktop, dual channel

One version, two packages: the NSIS installer on GitHub Releases (updates
itself via electron-updater) and the AppX on the Microsoft Store (updates via
the Store). Everything here costs $0 beyond the Partner Center account you
already have.

## 0. One-time setup (already done unless marked)

| Item | Where | Status |
|---|---|---|
| Partner Center individual account, free flow | https://storedeveloper.microsoft.com | done 2026-09-18 (owner) |
| Name reserved: `CodeLock` | Partner Center → Apps and games | done |
| Identity values | Product management → Product identity | `tomdeleon.CodeLock` / `CN=1FAB0136-6259-41AC-B11B-8796A586B246` / `tomdeleon` |
| Windows 10/11 SDK on the build machine | free, https://developer.microsoft.com/windows/downloads/windows-sdk/ | present here (10.0.26100) |
| RS256 unlock key pair | `node scripts/gen-unlock-keys.mjs` | **not yet generated for real** — every package built so far used a throwaway key for build testing |
| Privacy URL | push `docs/store/PRIVACY.md` to `main` | **pending push** |

### Generating the real key pair (do once, keep forever)

```bash
node scripts/gen-unlock-keys.mjs
```

- Put the `JWT_UNLOCK_PRIVATE_KEY=…` line into the API's `.env`
  (`apps/api/.env` locally, `deploy/.env` on a server). Restart the API; it
  refuses to boot if the key is not a ≥2048-bit RSA key.
- Put the `CODELOCK_BUILD_UNLOCK_PUBLIC_KEY=…` value where builds read it:
  your shell for local builds, and GitHub → Settings → Secrets and variables →
  Actions → **Variables** (not Secrets — it is public) as
  `CODELOCK_BUILD_UNLOCK_PUBLIC_KEY`.
- Rotating the pair later means every installed client must get the new
  public key (a new release) *before* the API switches; plan a two-step.

Self-host users who install from the Store need the **same public key** their
own API uses. With RS256 that means each self-hoster generates their own pair
and pastes the public half into `config.json` (`unlockPublicKey`), because the
Store build bakes *your* public key, which only matches *your* API. This is
the honest consequence of Option S; the README setup guide must say it.
(Alternative for self-hosters: leave `unlockPublicKey` empty and set
`unlockSecret` in their own `config.json` to their API's HS256 secret — the
verifier accepts either; only the *build* is forbidden from carrying a secret.)

## 1. Cut a release

```bash
# 1. version — one source
npm version patch --workspace @codelock/desktop --no-git-tag-version   # or minor/major
git add apps/desktop/package.json package-lock.json && git commit -m version

# 2. build both channels from that version (Windows machine with the SDK)
export CODELOCK_BUILD_UNLOCK_PUBLIC_KEY='-----BEGIN PUBLIC KEY-----\n…'
export CODELOCK_STORE_IDENTITY_NAME=tomdeleon.CodeLock
export CODELOCK_STORE_PUBLISHER='CN=1FAB0136-6259-41AC-B11B-8796A586B246'
export CODELOCK_STORE_PUBLISHER_DISPLAY_NAME=tomdeleon
npm run release:store
```

Output in `apps/desktop/release/` (observed 2026-09-19, 59 s):

```
CodeLock Setup 1.0.0.exe            NSIS, x64 + arm64
CodeLock Setup 1.0.0.exe.blockmap   for electron-updater deltas
CodeLock 1.0.0.appx                 Store, x64, version 1.0.0.0, unsigned
CodeLock 1.0.0 arm64.appx           Store, arm64
```

The build stops with a named reason if: identity variables are missing or
malformed; the version's first component is 0; the HS256 secret is in the
environment; the public key is missing; the SDK is not installed; or
`dist/build-defaults.json` was not produced by a Store build.

```bash
# 3. optional but recommended: Windows App Certification Kit (elevated prompt)
& "C:\Program Files (x86)\Windows Kits\10\App Certification Kit\appcert.exe" test -appxpackagepath "apps\desktop\release\CodeLock 1.0.0.appx" -reportoutputpath "apps\desktop\release\wack-x64.xml"
```

Status: **unverified** — needs Administrator; not run in this session.

## 2. Ship the direct-download channel

```bash
git tag v1.0.0 && git push origin main --tags
```

`release-desktop.yml` builds on the three OS runners and opens a **draft**
GitHub Release with the installers and `SHA256SUMS.txt`. Publish the draft by
hand. Installed NSIS clients pick it up within six hours (deferred while
locked). Signing is still optional/unsigned (SmartScreen warning) — unchanged
by this work and outside the $0 constraint.

The same tag also runs the `store` job **if** these repository *Variables*
exist: `CODELOCK_STORE_IDENTITY_NAME`, `CODELOCK_STORE_PUBLISHER`,
`CODELOCK_STORE_PUBLISHER_DISPLAY_NAME`, `CODELOCK_BUILD_UNLOCK_PUBLIC_KEY`
(plus `CODELOCK_WEB_URL` / `CODELOCK_API_URL` if you want non-localhost
defaults). It uploads the two `.appx` as the `codelock-store` artifact. It
never touches Partner Center. Whether the `windows-latest` image's SDK is found
by `store-toolchain.mjs` is **unverified** until the first tagged run; a local
`npm run release:store` is the fallback and is what was actually tested.

## 3. Ship the Store channel (manual, in Partner Center)

1. Apps and games → CodeLock → **Start your submission**.
2. **Packages**: upload both `.appx`. Partner Center validates identity and
   version; the fourth component must be 0 and each submission's version must
   exceed the last.
3. **Properties / Pricing / Age rating / Store listing**: copy from
   LISTING.md. Privacy URL must be live.
4. **Notes for certification**: from CERTIFICATION-NOTES.md.
5. Submit. Certification typically takes hours to a few days; you get email.
   The Store signs the package; nothing to do with certificates.
6. After "In the Store": Phase 5 — install from the Store on this machine and
   run the matrix rows that were unverified (reboot, lock/unlock, Store
   signed install), then update TEAM-HANDOFF.md statuses to *live*.

## 4. Repair release

Bump (never reuse or lower a version — VERSIONING.md), rebuild both channels
with `npm run release:store`, publish the GitHub draft, upload the new `.appx`
in a new Partner Center submission. Store users receive it when the Store
decides; that timing is not controllable, and a Store update can install
while a lock is live (the lock restores on next launch).

## 5. Things that are deliberately not in this guide

- No code-signing certificate purchase; no hosting; no paid CI. Total
  recurring cost of the process above: **$0**.
- No automatic Partner Center submission (the Store Submission API exists but
  needs an Azure AD app registration — skipped, human upload is fine at this
  cadence).
- macOS/Linux targets: unchanged, still built by `dist:all` and the workflow.
