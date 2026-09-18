# Store listing — CodeLock 1.0.0

Everything below is what goes into Partner Center for the first submission.
It matches the initial scope in READINESS.md §4 and nothing more. Fields the
owner must fill or confirm are marked **[owner]**.

## Product identity (issued by Partner Center, 2026-09-18)

| Field | Value |
|---|---|
| Reserved name | CodeLock |
| Package/Identity/Name | `tomdeleon.CodeLock` |
| Package/Identity/Publisher | `CN=1FAB0136-6259-41AC-B11B-8796A586B246` |
| PublisherDisplayName | `tomdeleon` |
| Package family name (observed) | `tomdeleon.CodeLock_60h9tdzqyk992` |
| Packages to upload | `CodeLock 1.0.0.appx` (x64), `CodeLock 1.0.0 arm64.appx` — both version `1.0.0.0` |

## Pricing and availability

- Price: **Free**. No in-app purchases, no trial.
- Markets: all. Visibility: public. Discoverability: default.
- Device family: Windows 10/11 desktop only (x64, arm64). Min OS 10.0.18362.0.

## Properties

- Category: **Developer tools** (alternative: Productivity). **[owner]** pick one.
- Privacy policy URL: `https://github.com/TommyDeLeon/codelock/blob/main/docs/store/PRIVACY.md`
  — **valid only once `docs/store/PRIVACY.md` is pushed to `main`** (the repo
  is public). Until then this is blocker B7, not a link.
- Website: `https://github.com/TommyDeLeon/codelock`
- Support contact: `tommydeleon104@gmail.com` (already public per
  `apps/web/src/lib/contact.ts`) and `https://github.com/TommyDeLeon/codelock/issues`
- System requirements: Windows 10 1903 or later; internet or LAN access to a
  self-hosted CodeLock server; that server needs Docker.

## Age rating (IARC questionnaire inputs)

Answer every content question **No**: no violence, sexual content, language,
controlled substances, gambling, fear, discrimination. Interactive elements:
users **cannot** interact with each other, **cannot** share personal
information, the app **does not** share location, **no** in-app purchases,
**no** unrestricted internet access (it only contacts the server the user
configured). Expected result: rated for all ages / 3+. **[owner]** submit the
questionnaire; do not pre-fill a rating.

## Store listing text (en-US)

**Description** (first line is the 10.2.4 dependency disclosure):

> Requires a CodeLock server that you run yourself (free, self-hosted, Docker) — see the setup guide at github.com/TommyDeLeon/codelock.
>
> CodeLock is a focus timer for programmers. Arm a block of 15 to 90 minutes and get to work. When the timer fires, CodeLock covers every screen and stays there until you solve a programming problem — graded live by your own CodeLock server, in Python, JavaScript, TypeScript, Java, C++ or Go. Solve it and you're back in. Need out? Hold Escape for ten seconds; the session is recorded as abandoned.
>
> What it does
> • Full-screen lock on every display when your timer fires
> • Problems that adapt to you: easy → medium → hard as you solve quickly
> • Personal records, streaks and a run log on the dashboard
> • Runs at startup (optional) so an armed timer survives a reboot
> • Nothing leaves your PC except to the server you configured; no accounts, no telemetry
>
> What it is not
> CodeLock is a commitment device, not parental control or security software. Ctrl+Alt+Del, signing out, a power-off, or deleting its state file will always get you out — that is documented and deliberate.
>
> Setup
> Install the CodeLock server on this PC or on a machine you trust (Docker Compose, one command), then enter its address in Settings. Without a server CodeLock will not arm a timer.
>
> If you previously installed CodeLock from the direct-download installer, uninstall that version first; both use the same profile.

**Short description** (≤ 200 chars):
> A focus timer that locks your screen until you solve a programming problem, graded by your own self-hosted CodeLock server. Free. No accounts, no telemetry.

**Search terms** (≤ 7): focus timer, coding practice, programming problems, pomodoro, commitment device, leetcode-style, deep work

**What's new in 1.0.0**: First Microsoft Store release.

**Copyright**: Copyright © 2026 CodeLock. **[owner]** the repository has no
root software licence (README "Licensing"); the listing must not describe the
app as open source until one is chosen. Problem content is CC0-1.0
(`data/NOTICE`: 696 CodeLock-authored + 529 CodeLock-generated = 1225
problems, both CC0) — no third-party attribution required. `data/LICENSE`
still calls the code "free software by the usual definition", which the README
flags as a contradiction to resolve; it does not affect the listing text above.

## Screenshots

Partner Center requires at least one desktop screenshot (recommended
1366×768 or larger, PNG).

| File | Captured | Shows | Status |
|---|---|---|---|
| `docs/store/screenshots/01-dashboard.png` | 2026-09-19, packaged 1.0.0 (Developer-Mode registration), maximised, 1920×1024 | Dashboard: session picker, stats, run log, tier/streak panel | ready |
| `02-lock-screen.png` | 2026-09-19, real lock (5-min session armed via the local API, fired, released with a 10-s Escape hold), 1920×1080 | Lock screen: problem "Capitalise Each Word", editor, console, Escape hint | ready |
| `03-settings.png` | same run, 1920×1024 | Settings: lock hours, default length, repeat sessions, after-solve options | ready |
| `04-learn-progress.png` | same run, 1920×1024 | Learn & Progress: recommended lesson, patterns, foundations | ready — **this tab comes from the owner's uncommitted learn work**; the uploaded package was built from the working tree and includes it, so that work must be committed before/with the submission |

Upload order in Partner Center: 02 (lock screen — the product), 01, 04, 03.

No trailer. No promotional art beyond the required 300×300 logo, which
electron-builder generates from `build/icon.png`.

## Certification section

- Notes for certification: use the draft in CERTIFICATION-NOTES.md, choosing
  the "testable without a server" sentence unless a test server exists.
- Restricted capabilities: `runFullTrust` only. Partner Center flags it on
  upload ("require approval before you can use them") — observed 2026-09-19.
  If Submission options shows a Restricted capabilities box, paste the
  justification from CERTIFICATION-NOTES.md ("Restricted capability
  justification").

## Blockers before this listing can be submitted

| Item | Status |
|---|---|
| Privacy URL live | **blocked** until `docs/store/PRIVACY.md` is on `main` |
| Screenshots | done (4 captured) |
| Real RS256 key pair generated and public key baked (`RELEASE-GUIDE.md`) | **open** — the packages built so far used a throwaway key for build testing only |
| Category and licence decision | **owner** |
| WACK run | **unverified** |
