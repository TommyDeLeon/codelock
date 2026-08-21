# Signing key inventory

Fill in the blanks as you create each key. The point of this file is that
future-you can answer "where is that key and what happens if it is gone?"
without archaeology.

**Nothing in this file is a secret.** Passwords, `.pfx` files, and keystores
live outside the repository — see the checklist at the bottom.

---

## Windows code signing

| | |
|---|---|
| Type | Self-signed (Track A) |
| Subject / CN | `CN=CodeLock` — **must** match `CODELOCK_PUBLISHER_CN` |
| Algorithm | RSA 3072, SHA-256 |
| Created | _not yet created_ |
| Expires | _created + 3 years_ |
| Private key | `.pfx`, _location:_ ______________ |
| Public cert | `.cer`, _location:_ ______________ |
| Backup | _location:_ ______________ |
| CI secret | `CSC_LINK` (base64 of the .pfx), `CSC_KEY_PASSWORD` |

**If lost:** recoverable. Generate a new certificate, re-import it as a trusted
publisher on each machine, and re-sign. Existing installs keep working —
signatures made while the old certificate was valid stay valid **provided they
were RFC 3161 timestamped**, which `sign-windows.ps1` always does.

**On expiry:** timestamped signatures remain valid indefinitely. Only *new*
builds need a new certificate.

---

## Android release keystore

| | |
|---|---|
| Type | RSA 4096, validity 10000 days |
| File | `codelock-release.jks` |
| Alias | `codelock` |
| Created | _not yet created_ |
| SHA-256 fingerprint | _record it here — CI pins against this_ |
| Location | ______________ |
| Backup | ______________ |
| CI | managed by EAS, or `EXPO_ANDROID_KEYSTORE_*` |

**If lost: NOT recoverable.** This is the one irreversible mistake in the whole
signing phase.

Android identifies an app by package name **plus signing key**. A build signed
with a different key is a different app as far as every installed device is
concerned. Consequences:

- Every phone with CodeLock installed can never be updated again.
- The only path forward is uninstall and reinstall, which wipes local state.
- Google cannot reset it. Play App Signing key rotation does not help if you
  never enrolled before losing it.

Back it up in **two** places that are not the build machine, today, before you
build anything with it.

---

## macOS

| | |
|---|---|
| Track A | Ad-hoc (`codesign --sign -`). No key to store. |
| Track B | Developer ID Application certificate — _not obtained_ |
| CI secrets | `CSC_LINK`, `CSC_KEY_PASSWORD`, `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID` |

**If lost:** recoverable. Revoke in the Apple Developer portal and issue a new
one. Note that ad-hoc signatures change identity on every rebuild, which makes
macOS re-prompt for Accessibility and Screen Recording each time — see
`TRUSTED-INSTALL.md`.

---

## Linux GPG

| | |
|---|---|
| Key id | _not yet created_ |
| Expires | ______________ |
| Public key published at | _the download page_ |
| Backup | ______________ |

**If lost:** recoverable. Publish a new public key and re-sign. Users who
pinned the old key have to update it.

---

## Application secrets (not signing, but same discipline)

| Secret | Rotating it costs |
|---|---|
| `JWT_ACCESS_SECRET` | Every access token invalid; clients refresh transparently. |
| `JWT_REFRESH_SECRET` | Every session ends; everyone signs in again. |
| `JWT_UNLOCK_SECRET` | Desktop shells with the old key **cannot verify unlocks** and will stay locked. Rotate the app config at the same time, or people get trapped behind an overlay. |
| `ENCRYPTION_KEY` | Every stored GitHub token becomes undecryptable; users must reconnect. |
| `CODELOCK_UNLOCK_PUBLIC_KEY` | Baked into installers. Changing it requires a new release before rotating the server key. |

The unlock secret is the dangerous one. Rotating it server-side while installed
shells still hold the old key means a user solves the problem, the API issues a
valid token, and the shell rejects it — a lock with no exit but the kill switch.

---

## Checklist before you build anything for real

- [ ] `.pfx` and its password stored outside the repo
- [ ] `.jks` backed up in two places that are not the build machine
- [ ] Android SHA-256 fingerprint recorded above and pinned in CI
- [ ] `.gitignore` covers `*.pfx`, `*.jks`, `*.keystore`, `*.p12`, `*.cer`
- [ ] `CODELOCK_PUBLISHER_CN` matches the certificate CN exactly
- [ ] Auto-update proven end to end (install v1, publish v2, no prompt)
