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

### 0. Check Smart App Control first

**Track A does not work on a machine with Smart App Control enforcing.** Check
before spending the afternoon:

```powershell
Get-ItemProperty "HKLM:\SYSTEM\CurrentControlSet\Control\CI\Policy" -Name VerifiedAndReputablePolicyState
```

`0` is off and Track A applies. `1` is enforced and `2` is evaluation, which
switches itself to enforced without warning — in both cases stop here and read
on. `npm run dist` prints this verdict at the end of every build.

Smart App Control is on by default on clean Windows 11 installs. It enforces at
the user-mode code integrity layer, which sits *below* SmartScreen: there is no
"run anyway" button, because there is no prompt. An unsigned binary is refused
at load, so the NSIS installer appears to complete and the app then never
opens — no window, no crash dialog, nothing in the app's own logs, because none
of its code ever ran. What it looks like is a broken app. What it is, is a
blocked one.

Confirm that is what happened:

```powershell
Get-WinEvent -LogName Microsoft-Windows-CodeIntegrity/Operational | Where-Object Message -match CodeLock | Select-Object -First 3 TimeCreated,Id,Message
```

Events **3033** and **3077** naming `CodeLock.exe` or `CodeLock Setup <version>.exe`
are the block. Note that the installer itself is subject to it, so "the install
succeeded" may mean only that the installer window closed.

**The self-signed certificate in steps 1–5 below does not lift this.** Importing
it into `LocalMachine\Root` and `TrustedPublisher` establishes trust locally,
and Smart App Control does not consult local trust — it wants a signer that is
reputable to Microsoft, or an explicit allow rule in policy. Adding a
certificate to a store creates no such rule.

#### What was measured, exactly

On a machine with `VerifiedAndReputablePolicyState = 1`, three separate results:

| Artifact | Result |
|---|---|
| `CodeLock Setup <version>.exe` (NSIS installer) | **Blocked**, both before and after the flag below |
| `release\win-unpacked\CodeLock.exe` from a default build | **Blocked** — CodeIntegrity 3033/3077 |
| `release\win-unpacked\CodeLock.exe` built with `-c.win.signAndEditExecutable=false` | **Launches**, no block event logged |

```bash
npx electron-builder --win nsis --x64 --arm64 -c.win.signAndEditExecutable=false --publish never
```

That is the same flag the "Building locally on Windows" section at the bottom
recommends for the symlink-privilege problem, and it costs the same thing: the
executable keeps Electron's stock icon and version metadata, because `rcedit`
writes those and the flag disables `rcedit`.

**So the installed app is not the thing this rescues.** Every NSIS installer
build is a freshly generated, unsigned stub with no reputation, and it stays
blocked. When it is blocked it writes nothing at all — no program directory, no
Start Menu shortcut, no uninstall entry — while still closing like a completed
install. "The installer ran and then the app never opened" is very often this,
and it is worth checking `%LOCALAPPDATA%\Programs\CodeLock` before debugging
any application code:

```powershell
Test-Path "$env:LOCALAPPDATA\Programs\CodeLock\CodeLock.exe"
```

`False` after a supposedly successful install means nothing was installed.

What the flag buys is a **runnable local build**: launch
`release\win-unpacked\CodeLock.exe` directly, or make a shortcut to it, and skip
the installer entirely while developing.

#### Installing on your own machine without the installer

Smart App Control's verdict follows the binary, not its location — a copy of
`win-unpacked` runs from anywhere it is put. That is enough to create by hand
everything the NSIS installer would have:

```powershell
.\apps\desktop\scripts\install-local.ps1
```

It copies the unpacked build to `%LOCALAPPDATA%\Programs\CodeLock` (the same
per-user location `perMachine: false` targets), writes a Start Menu shortcut,
and launches it once. That last step matters: `setAutoStart(true)` runs on
`ready` in packaged builds only, and it registers the login item at whatever
path the app was started from. Launching the *installed* copy is what points
the login item somewhere that survives a rebuild — launching straight out of
`release\` registers a login item into the build tree, which breaks the next
time that directory is cleaned.

Re-run it after every rebuild; it replaces the directory rather than merging
into it. `-NoStart` skips the launch, and therefore the login item.

This is a machine-you-own path. It produces no uninstall entry — remove it by
deleting the folder, the Start Menu shortcut, and the `CodeLock.exe` value
under `HKCU:\Software\Microsoft\Windows\CurrentVersion\Run` — and it gives
other people nothing they can install.

**The negative control was not run.** A build with the flag *on* cannot be
produced on that machine at all, because `rcedit` lives inside the `winCodeSign`
bundle whose extraction needs `SeCreateSymbolicLinkPrivilege`. The flag is the
only variable that changed, but "rcedit's resource rewrite is what Code
Integrity objects to" is inference, not a demonstrated mechanism. Note also
that Electron's own `electron.exe` from npm is itself unsigned and runs fine,
so plain unsignedness is not the whole story either.

The durable options, on a machine where Smart App Control is enforcing:

| Option | Effect | Cost |
|---|---|---|
| Sign with any CA in the **Microsoft Trusted Root Program** | The build launches anywhere. Microsoft's own Smart App Control docs say that when its intelligence service cannot predict a file, it still allows one "signed with a certificate issued by a certificate authority within the Trusted Root Program" — so EV is not required *for this*; EV buys SmartScreen reputation, which is a different problem | See the cheapest routes below |
| Deploy an explicit **WDAC allow rule** (publisher, catalog, or hash) for CodeLock | The build launches, narrowly scoped | Policy-admin access to the machine |
| Turn Smart App Control **off** in Windows Security → App & browser control | The build launches; the machine loses that protection, and re-enabling it later requires a Windows reinstall | Your call, deliberately made |
| Run unpackaged: `npm run dev -w @codelock/desktop` | Works today — Electron's own binary is the host and is already reputable | Not a shipping path |

The last one is why development works while a default `npm run dist` output
does not, and it is the fastest way to confirm the app code is fine before
touching signing at all.

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
ELECTRON_CACHE=<project-volume>/.electron-cache ELECTRON_BUILDER_CACHE=<project-volume>/.eb-cache npm run dist -w @codelock/desktop
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
