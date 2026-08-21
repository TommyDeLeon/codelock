# Installing CodeLock without a security warning

Two separate problems, often confused:

- **Track A** — make CodeLock install cleanly **on machines you own**. Free,
  takes an afternoon, works today. This is legitimate self-trust: you own the
  hardware, you generate the key, you decide to trust it.
- **Track B** — make CodeLock install cleanly on **anyone's** machine. Costs
  money, takes weeks of waiting, and for Windows needs a verifiable business
  entity. Start it early because the waits are long.

Everything below Track A has been **written but not executed** — see
"What has actually been tested" at the end.

---

# Track A — your own devices

## Windows

### 1. Generate the certificate

Run in a normal (non-admin) PowerShell. This creates a key in your own user
store; nothing system-wide changes yet.

```powershell
$cert = New-SelfSignedCertificate -Type CodeSigningCert -Subject "CN=CodeLock" -KeyExportPolicy Exportable -KeySpec Signature -KeyLength 3072 -HashAlgorithm SHA256 -CertStoreLocation "Cert:\CurrentUser\My" -NotAfter (Get-Date).AddYears(3)
```

Note the subject: `CN=CodeLock`. **Write it down exactly.** It has to match
`CODELOCK_PUBLISHER_CN` later or auto-update breaks in a way that produces no
error message at all.

### 2. Export it

Pick a password when prompted. Store the `.pfx` **outside the repository** —
somewhere like `D:\keys\`, not in the project folder.

```powershell
$pw = Read-Host -AsSecureString -Prompt "Password for the .pfx"
Export-PfxCertificate -Cert $cert -FilePath D:\keys\codelock-signing.pfx -Password $pw
```

Export the public half too — this is the file you install on each machine, and
it contains no private key, so it is safe to copy around:

```powershell
Export-Certificate -Cert $cert -FilePath D:\keys\codelock-public.cer
```

Back both up somewhere off the build machine. See
[`SIGNING-KEYS.md`](SIGNING-KEYS.md) for what breaks if you lose them.

### 3. Trust it, on each machine you own

**This needs an elevated PowerShell**, and it changes a security setting on the
machine — installing a trusted root. Do it deliberately, and only for a
certificate whose private key you control.

```powershell
Import-Certificate -FilePath D:\keys\codelock-public.cer -CertStoreLocation Cert:\LocalMachine\Root
```

```powershell
Import-Certificate -FilePath D:\keys\codelock-public.cer -CertStoreLocation Cert:\LocalMachine\TrustedPublisher
```

Both matter, and for different reasons. `Root` makes the certificate chain
validate at all. **`TrustedPublisher` is the one that actually silences the
prompt** — without it the signature verifies, and Windows still asks.

This is a one-time step per machine. Anyone else who installs your build still
sees SmartScreen; that is what Track B is for.

### 4. Sign

```powershell
npm run dist -w @codelock/desktop
```

```powershell
.\apps\desktop\scripts\sign-windows.ps1 -PfxPath D:\keys\codelock-signing.pfx
```

The script signs every `.exe` in `release\` with SHA-256 and an RFC 3161
timestamp, then prints the verification result.

**The timestamp is not optional.** Without it, every signature stops validating
the day the certificate expires — three years from now, every installed copy of
CodeLock becomes an untrusted binary simultaneously. With it, signatures made
while the certificate was valid stay valid forever.

### 5. Tell the updater who you are

`publisherName` in the build config must be **exactly** the CN from step 1.
electron-updater compares the publisher on the downloaded installer against it,
and a mismatch makes every update fail **silently** — no error, no dialog, no
update, ever. It is supplied at release time:

```powershell
gh variable set CODELOCK_PUBLISHER_CN --body "CodeLock"
```

---

## macOS

A free Apple ID gives you a local-only signing identity. It will not satisfy
Gatekeeper for distribution — that needs Track B — but it is enough for your
own Macs.

```bash
codesign --deep --force --sign - "release/mac/CodeLock.app"
```

First launch on each Mac: **System Settings → Privacy & Security → "Open
Anyway"**. Or strip the quarantine attribute directly:

```bash
xattr -dr com.apple.quarantine "/Applications/CodeLock.app"
```

One thing specific to this app: CodeLock asks for **Accessibility** and
**Screen Recording** permissions to keep the lock window in front. macOS keys
those grants to the code signature. An ad-hoc signature (`--sign -`) produces a
**different identity on every rebuild**, so macOS forgets the grants and
re-prompts every single time you rebuild. Use a stable identity — even a free
one from Xcode — if you are iterating.

## Linux

AppImage plus a detached GPG signature. Publish the public key on the download
page so it can be checked.

```bash
gpg --detach-sign --armor "release/CodeLock-0.1.0.AppImage"
```

```bash
gpg --verify "release/CodeLock-0.1.0.AppImage.asc"
```

Optionally ship the `.deb` signed with the same key behind a small apt repo, so
`apt upgrade` handles updates instead of electron-updater.

## Android

```bash
keytool -genkeypair -v -keystore codelock-release.jks -alias codelock -keyalg RSA -keysize 4096 -validity 10000
```

**Back this file up before you do anything else with it.** Losing the Android
keystore is the one mistake in this whole phase that is not recoverable: every
device with CodeLock installed can never be updated again, only uninstalled and
reinstalled, wiping local state. Google cannot reset it for you.

Build a signed APK for direct install:

```bash
eas build --platform android --profile production-apk
```

On the phone, enable "Install unknown apps" for your file manager once. After
that, signed updates install cleanly as long as the signing key matches — which
is exactly why losing the keystore is terminal.

Pin the fingerprint in CI so a key mismatch fails loudly rather than producing
an APK that refuses to install over the existing one:

```bash
keytool -list -v -keystore codelock-release.jks -alias codelock | grep SHA-256
```

## iOS

There is no free path. Free provisioning profiles expire after **7 days** and
cap at 3 apps — unusable for a lock app you depend on daily. Permanent
installation needs the paid Apple Developer Program ($99/yr) and TestFlight.

Said plainly here rather than shipping something that dies every week.

---

# Track B — anyone's device

Start now; the waits are the long pole.

## Windows

| Option | Immediate trust? | Requires |
|---|---|---|
| OV certificate | No — builds SmartScreen reputation slowly, still warns at first | Organization validation |
| EV certificate | Yes | Hardware token or cloud HSM, organization validation |
| Azure Trusted Signing | Yes | Azure subscription, organization validation |

Azure Trusted Signing is the cheapest credible route today. All three need a
**verifiable business entity**, which is the real blocker for a solo project —
not the money.

## macOS

Apple Developer Program → Developer ID Application certificate → sign →
notarize → staple.

```bash
xcrun notarytool submit "release/CodeLock-0.1.0.dmg" --apple-id "$APPLE_ID" --team-id "$APPLE_TEAM_ID" --password "$APPLE_APP_SPECIFIC_PASSWORD" --wait
```

```bash
xcrun stapler staple "release/CodeLock-0.1.0.dmg"
```

Without notarization Gatekeeper blocks it on every machine but yours. Hardened
runtime must be on (it already is in `electron-builder.yml`), with entitlements
declared for anything Electron needs — JIT and unsigned executable memory are
already in `build/entitlements.mac.plist`.

## Android

Play Store requires Play App Signing and a privacy policy. A device-locking
overlay app **will** draw manual review over `SYSTEM_ALERT_WINDOW` and any
Accessibility Service use. Write the justification before submitting, not
after being rejected. Direct APK distribution stays the fallback and is what
Track A covers.

## iOS

App Store review scrutinises any Screen Time / Managed Settings usage. The
`com.apple.developer.family-controls` entitlement is **request-gated** — read
the requirements before building anything on top of it.

---

# Building locally on Windows

Two environment quirks hit on a real Windows 11 machine, both unrelated to the
project's own config. Recorded because the error messages point nowhere useful.

**1. Cross-drive rename during download.** With the project on `D:` and the
default caches under `C:\Users\...\AppData\Local`, electron-builder fails with
*"cannot move downloaded into final location"* and then *"The system cannot
find the file specified"*. Put both caches on the same volume as the project:

```bash
ELECTRON_CACHE=D:/Cowork/.electron-cache ELECTRON_BUILDER_CACHE=D:/Cowork/.eb-cache npm run dist -w @codelock/desktop
```

**2. Symlink privilege.** Extracting electron-builder's `winCodeSign` bundle
creates symlinks for two macOS `.dylib` files. Windows refuses unless the user
holds `SeCreateSymbolicLinkPrivilege`, so the build dies on files a Windows
build never uses. Fix it once by enabling **Settings → System → For developers
→ Developer Mode**, or run the build from an elevated shell.

To build without touching that setting — at the cost of the executable's icon
and version metadata, since `rcedit` lives inside the same bundle:

```bash
npx electron-builder --win nsis --x64 -c.win.signAndEditExecutable=false --publish never
```

GitHub's Windows runners hold the privilege, so CI is unaffected.

---

# What has actually been tested

| | |
|---|---|
| Unsigned NSIS x64 installer builds | **Yes.** 82 MB, `Get-AuthenticodeSignature` reports `NotSigned` as expected. |
| Packaged contents correct | **Yes.** All main-process modules and `electron-updater` are inside `app.asar`; no `app-update.yml`, so a local build's updater is inert by design. |
| Certificate generation, signing, trust import | **No.** Every command above is written but unexecuted. Creating a signing key and installing a trusted root are your decisions to make, not something to run on your behalf. |
| macOS / Linux artifacts | **No.** No hardware available. |
| Auto-update end to end (install v1, publish v2, confirm) | **No.** Needs a published GitHub Release. This is the last thing to prove before calling the phase done. |
