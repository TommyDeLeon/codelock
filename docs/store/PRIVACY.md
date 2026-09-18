# CodeLock privacy notice (Microsoft Store edition)

Last updated 2026-09-19. This notice covers the CodeLock desktop app
distributed through the Microsoft Store. It is consistent with the notice
served by a self-hosted CodeLock web app at `/privacy`; where the two differ,
the more specific statement here applies to the Store app.

## What CodeLock is

CodeLock is a focus timer for programmers. When a timer you armed fires, the
app covers your screen until you solve a programming problem that is graded
by a **CodeLock server you run yourself**. The Store app contains no server
and talks to no service operated by the developer.

## What the app stores on your PC

All under your Windows user profile (the Store redirects it to the app's own
package folder):

- `config.json` — the server addresses you configured and the public key used
  to verify unlock tokens. No secrets.
- `lock-state.json` — whether a lock is currently live and which session it
  belongs to, so a crash or restart does not silently unlock.
- `session.enc` — an encrypted session record for your own server.
- Standard Chromium/Electron browser state (cache, preferences).

Uninstalling the Store app removes the package folder. If you previously used
the direct-download installer, its profile under `%APPDATA%\CodeLock` is left
in place; delete it yourself if you want everything gone.

## What the app sends, and where

Only to the server address **you** typed into settings (default:
`http://localhost`, i.e. your own machine):

- the code you submit to solve a problem, and the verdict/timing that comes
  back;
- timer, lock and session events;
- settings and progress used to pick your next problem.

That server is yours. Its own data handling is described in its `/privacy`
page and in the README ("Data and removal"): data lives in your Postgres
database until you delete it; submitted code runs in a throwaway container
with networking disabled.

## What the app does not do

- No analytics, telemetry, crash reporting, advertising, or third-party SDKs.
- No account with the developer; no sign-in; nothing is sent to the developer.
- No location, contacts, camera, microphone, or file access outside its own
  profile folder.
- No network traffic other than to the server you configured and, for the
  direct-download edition only, GitHub Releases for updates. The Store edition
  updates through the Microsoft Store.

## Children

CodeLock is a developer tool and is not directed at children. It collects no
personal information for the developer, so there is nothing for the developer
to delete; data on your own server is under your control.

## Contact

Tommy De Leon — tommydeleon104@gmail.com — https://github.com/TommyDeLeon/codelock/issues
