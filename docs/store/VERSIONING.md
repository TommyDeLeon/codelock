# Versioning — one source, two channels

## The one source

`apps/desktop/package.json` → `"version"`. Nothing else carries a version:
`electron-builder.yml` has none, the workflow reads none, and the Store
identity script refuses to run if this one is unusable.

| Channel | Derived version | Where it lands |
|---|---|---|
| Direct download (NSIS + electron-updater) | `X.Y.Z` as-is (semver) | `CodeLock Setup X.Y.Z.exe`, `latest.yml`, GitHub Release tag `vX.Y.Z` |
| Microsoft Store (AppX) | `X.Y.Z.0` | `Package/Identity/@Version` in `AppxManifest.xml` |

The mapping is electron-builder's `AppInfo.getVersionInWeirdWindowsForm()`
(RESEARCH §4): `${major}.${minor}.${patch}.0`. Prerelease tags (`1.0.0-beta.1`)
are **dropped**, so two prereleases of the same patch would collide in the
Store; never submit a prerelease to the Store.

## Rules the Store enforces (RESEARCH §4, primary source)

1. Four parts, each 0–65535.
2. The **first part cannot be 0** → the Store channel starts at `1.0.0`
   (`0.1.0` was the previous dev version; bumped 2026-09-18).
3. The **fourth part must be 0** when you build; the Store may rewrite it.
   `dist-store.mjs` never sets `buildNumber`, so it is always 0.
4. Installed customers only move to a **higher** version. There is no
   downgrade for existing installs.

## Repair releases

Something broke in `1.2.0` on the Store:

- Do **not** try to "roll back". Re-uploading `1.1.0` only affects new
  acquisitions; everyone already on `1.2.0` keeps it (RESEARCH §4, quoted).
- Fix, bump to `1.2.1` (or `1.3.0`), build **both** channels from that one
  version, submit the Store package and publish the NSIS release. Store users
  get it when the Store next checks (not controllable); NSIS users within
  six hours via electron-updater, deferred if locked.
- Never re-use a version: a Store submission with a version equal to a
  previous one is rejected; an NSIS `latest.yml` with a repeated version
  would be ignored by installed clients.

## Bumping

```
# from the repo root
npm version <patch|minor|major> --workspace @codelock/desktop --no-git-tag-version
```

That edits `apps/desktop/package.json` and `package-lock.json` only. Commit
with a one-word message, tag `vX.Y.Z` when releasing (the tag triggers
`release-desktop.yml`).

## What is deliberately not versioned here

- `apps/api`, `apps/web`, `apps/judge`: server images are tagged by commit /
  branch in `publish-images.yml` and are compatible across desktop versions
  by contract (the API is additive; RS256 issuance added in commit `unlock`
  is optional and defaults off).
- The Store listing text and screenshots: Partner Center keeps those per
  submission.
