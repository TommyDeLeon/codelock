# Team handoff — CodeLock on the Microsoft Store

Revision: `main` at `5331d92` (+ this file and RELEASE-GUIDE.md, committed
next as `handoff`). Base was `174f758`. Written 2026-09-19.

## Who did what

| Work | Produced by | Reviewed by |
|---|---|---|
| Research, readiness audit, all code and docs in this handoff | Claude Opus 5 (this session, model id `claude-opus-5`, medium effort) | — |
| Security review of `07be710..161dc95` | `ecc:security-reviewer` agent (Opus 5) | findings applied in `f59a3b9` |
| TypeScript review of the same range | `ecc:typescript-reviewer` agent (Opus 5) | findings applied in `f59a3b9` |
| Sanitizer over the unpacked `.appx` | `ecc:opensource-sanitizer` agent (Opus 5) | PASS; `.map` exclusion applied in `5c3a820` |
| Migration `20260918120000_learn` review | `ecc:database-reviewer` agent (Opus 5) | read-only; no change |
| Partner Center registration, name reservation, identity values | Owner (human) | — |
| Decisions #1 (Option S) and #3 (dual-channel) | Owner | — |

No joint-review claim is made for anything not listed above. No paid model or
external service was used. Nothing was pushed, tagged, uploaded, or submitted.

## What changed (27 files, +1420/−25)

| Area | Files | Commit |
|---|---|---|
| RS256 unlock issuance (API), key generator, env docs | `apps/api/src/lib/{unlockSigner,tokens}.ts`, `unlockSigner.test.ts`, `apps/api/src/env.ts`, `apps/api/.env.example`, `deploy/.env.example`, `deploy/docker-compose.yml`, `scripts/gen-unlock-keys.mjs` | `unlock`, `review` |
| Store target, identity-from-env build, SDK toolchain overlay, secret guard, updater/startup gates, version 1.0.0, source-map exclusion | `apps/desktop/electron-builder.yml`, `apps/desktop/package.json`, `package-lock.json`, `apps/desktop/scripts/{dist-store,store-toolchain,write-defaults}.mjs`, `apps/desktop/src/{updater,background}.ts` | `store`, `spawn`, `review`, `maps` |
| Release command + CI | `package.json` (`release:store`), `.github/workflows/release-desktop.yml` | `release` |
| Docs | `docs/store/{RESEARCH,READINESS,CERTIFICATION-NOTES,VERSIONING,DATA-PATHS,TEST-MATRIX,LISTING,PRIVACY,RELEASE-GUIDE,TEAM-HANDOFF}.md`, `docs/store/screenshots/01-dashboard.png` | `research`, `store`, `data`, `release`, `handoff` |

Untouched, by rule: the owner's uncommitted API/learn/desktop-renderer work,
the `20260918120000_learn` migration, the updater and lock engine logic, the
appId/product name, NSIS/macOS/Linux targets.

## Decisions

1. **Backend = self-host URL on first run (Option S).** Owner's first wish was
   hosted zero-setup; deferred because the API is single-user with no auth
   (`localUser.ts`), a public judge is anonymous RCE on the owner's VM, and
   certification needs the server up. Hosted is the 1.1 plan (below).
2. **Dual-channel.** NSIS + electron-updater untouched; Store package built
   from the same version by `npm run release:store`.
3. **Stay on electron-builder 25.1.8 `appx`.** The Store accepts `.appx`; the
   only defect found (vendored 2019 `makeappx.exe` fails SxS on Windows 11
   26200) is worked around by overlaying the free Windows SDK tools
   (`store-toolchain.mjs`) rather than upgrading to 26.x.
4. **RS256 for distributed builds.** The API now signs RS256 when
   `JWT_UNLOCK_PRIVATE_KEY` is set; the Store build refuses to carry the
   HS256 secret and requires the public key. Consequence for self-hosters is
   spelled out in RELEASE-GUIDE §0.
5. **Version 1.0.0** (Store forbids a leading 0).

## Commands run and actual results

| Command | Result |
|---|---|
| `npm run typecheck` | pass (all workspaces) |
| `npm test` | 373 tests, 0 failures (API; other workspaces have no suites by owner's choice) |
| `npx tsx --test apps/api/src/lib/unlockSigner.test.ts` | 6/6 |
| `npm run dist:desktop` | `CodeLock Setup 1.0.0.exe` + `.blockmap`; policy check: unsigned builds may launch here |
| `npm run dist:store` (with identity env + throwaway public key) | `CodeLock 1.0.0.appx` 120 MB, `CodeLock 1.0.0 arm64.appx` 126 MB; manifest verified by `makeappx unpack` |
| `npm run release:store` | all four artifacts, 59 s |
| Guard negatives (missing identity / bad CN / secret in env / no key / stale build-defaults) | each exits 1 with the named reason |
| `Add-AppxPackage -Register` (Developer Mode) → launch → A→B 1.0.1.0 → duplicate launch → `Remove-AppxPackage` | all as recorded in TEST-MATRIX.md (passed) |
| WACK (`appcert.exe`) | **unverified** — requires elevation |
| `npx @electron/asar list … \| grep .map` | 0 after `maps` commit |

## Costs

| Item | Cost |
|---|---|
| Partner Center individual account (free flow, ID verification) | $0 — paid/handled by owner personally |
| Windows SDK, WACK, makeappx | $0 (Microsoft, free) |
| Store code signing and CDN hosting | $0 (Store re-signs after certification) |
| GitHub Actions `windows-latest` for the `store` job | $0 within the free public-repo allowance; job only runs on tags and only if variables are set |
| NSIS channel | unchanged; still unsigned (no certificate bought) |
| Model usage this session | Opus 5 via the owner's existing plan; no API keys |
| **Recurring total added by this work** | **$0** |

## Status per item

| Item | prepared | tested | submitted | approved | live |
|---|---|---|---|---|---|
| Store package build (x64, arm64) | ✅ | ✅ local, Dev-Mode install | — | — | — |
| RS256 unlock path | ✅ | ✅ unit; end-to-end unverified | — | — | — |
| Build guards (no secret in Store builds) | ✅ | ✅ | — | — | — |
| Updater off under Store / startup task | ✅ | code-read only; reboot unverified | — | — | — |
| Data migration NSIS→Store | ✅ | ✅ observed in place | — | — | — |
| Uninstall | ✅ | ✅ | — | — | — |
| `release:store` command | ✅ | ✅ | — | — | — |
| CI `store` job | ✅ | **untested** (needs a tag + variables) | — | — | — |
| WACK | — | **unverified** | — | — | — |
| Listing text, age-rating inputs | ✅ | — | — | — | — |
| Screenshots | 1 of 3 (re-capture needed) | — | — | — | — |
| Privacy URL | file prepared | — | needs push | — | — |
| Partner Center submission | — | — | **not started** | — | — |

## Blockers and remaining human steps (in order)

1. **Generate the real key pair** (`node scripts/gen-unlock-keys.mjs`); put the
   private half in your API `.env`, the public half in your shell / GitHub
   Variables. Rebuild with `npm run release:store`.
2. **Push `main`** (this makes the privacy URL real:
   `https://github.com/TommyDeLeon/codelock/blob/main/docs/store/PRIVACY.md`).
3. **Run WACK** in an elevated prompt (RELEASE-GUIDE §1.3). Fix anything it
   flags; report back if it flags signing (expected for an unsigned package).
4. **Screenshots**: re-capture `01-dashboard.png` maximised; capture the lock
   screen and settings (LISTING.md).
5. **README setup guide** for self-hosters installing from the Store: the
   `unlockPublicKey`/`unlockSecret` step (RELEASE-GUIDE §0). Not written in
   this session because the README is the owner's voice and the learn work is
   mid-flight there.
6. **Licence decision** (README "Licensing") and **category** choice.
7. **Partner Center**: create the submission, upload both `.appx`, paste
   LISTING.md and CERTIFICATION-NOTES.md, submit. Do not enable auto-publish
   until Phase 5 verification.
8. Optional: set the four GitHub Variables so the `store` job runs on the next
   tag; it has never run yet.
9. **Phase 5** after approval: install from the Store on this machine; run
   TEST-MATRIX rows 1 (signed), 5, 6, 9; only then mark rows *live* here.

## Known gaps stated plainly

- Store update timing is not controllable; an update can land mid-lock.
- The startup task launches without `--background`; the window may show at
  logon in the Store build (CERTIFICATION-NOTES "Known gaps").
- Fresh-install `LocalCache` path is documented from Microsoft, not observed
  (the audit was not permitted to move the owner's live profile).
- NSIS and Store instances can run side by side (different identities).
- arm64 package never executed (no hardware).
- The `store` CI job's SDK discovery on `windows-latest` is untested.

## 1.1 plan (hosted, zero-setup — Option H), gated on B1

1. API: device-bound anonymous identity (`X-CodeLock-Device` token minted on
   first run, stored in `session.enc`; `User` row per device) behind a
   `MULTI_USER=true` flag; per-user quotas on `/v1/run` and `/v1/submissions`.
2. Oracle Cloud Always Free VM (needs card-verified signup — owner), DNS on
   the Hostinger domain, `deploy/.env`, `./deploy.sh`; the Caddy stack already
   keeps the judge private.
3. Bake `CODELOCK_BUILD_WEB_URL`/`API_URL` to the public host, update
   LISTING.md (drop the self-host disclosure, add the hosted privacy terms),
   bump to 1.1.0, resubmit.
