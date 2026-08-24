# Hand-off prompt

Paste everything below the line into a fresh chat. It is written to be read cold
by someone with no memory of the previous session.

---

## CodeLock — context for a new session

You are working on **CodeLock**, an npm-workspace monorepo at `D:/Cowork/codelock`.
A focus timer that locks the device until the user solves a programming problem
correctly **and fast enough**. Passing the tests is not sufficient: a working
O(n²) answer leaves the machine locked with *"roughly 2.1× slower than the best
known solution."*

Owner: TommyDeLeon. Personal use, plus sharing with people learning to program.
Free hosting only.

### Read these first

| File | Why |
|---|---|
| `PRE-LAUNCH-CHECKLIST.md` | ~120 audited items across 7 phases. The open-items list at the bottom is the live backlog. |
| `docs/LAUNCH.md` | Everything between here and a working install, in order. Start here. |
| `docs/DESIGN-BRIEF.md` | Design system and per-screen prompts. §1b is the game layer. |
| `docs/FREE-HOSTING.md` | The zero-cost deployment plan. |
| `docs/ESCAPE-MATRIX.md` | Every way the lock can be defeated, per platform. |

### Packages

`apps/api` (Node 24 · Express · Prisma · Postgres) · `apps/web` (Next 16 ·
React 19 · Tailwind 4) · `apps/judge` (Docker sandbox) · `apps/desktop`
(Electron kiosk) · `apps/mobile` (Expo) · `packages/shared` (the contract, TS
source consumed by every client).

### Invariants that must not regress

1. **Server-authoritative lock.** Clients never decide they are unlocked. The
   API signs a JWT bound to one `{userId, sessionId}`, only after the judge
   passes and the speed gate clears. Electron verifies it in the main process
   with a key the renderer cannot read. The problem is chosen at fire time.
2. **Speed gate.** `ceil(best × 1.35) + 40ms`, fastest of 2 runs; within a run
   the slowest test case counts. Timed inside the container.
3. **Adaptive difficulty.** Pure function, no I/O. 3 consecutive fast solves
   promotes, 2 consecutive failures demotes, both counters reset on tier change.
   The UI always shows the rule, never a mystery score.
4. **Sandbox.** Throwaway containers, no network, read-only FS, dropped caps,
   uid 65534, timing inside. **15 containment checks must stay green.**
5. **The demo cannot unlock anything.** `DemoGradeResult` has no token field,
   and a test asserts none appears on the wire.

### Design system (already implemented)

- Warm paper `#fbfaf8` light / near-black `#0e0e0d` dark.
- **Accent = Pine `#1b6b4a` / `#4ed18f`.** It is the brand *and* success — one
  green, one meaning. `--color-success` holds the same value deliberately.
- **Locked has no hue.** Ink on paper. Colour is reward-only: green is the thing
  the user is trying to make appear.
- Instrument Serif (display) · Inter (UI) · JetBrains Mono (every number).
- Hairline rules, not stacked cards. Never nest cards. Varied radii by weight.
- Theme: light / dark / system, a three-way segmented control in both navs.

### Current state

131 tests, 0 type errors, all builds green. ~30 commits, one-word messages.

**Working and verified:** the marketing site (`/`, `/demo`, `/how-it-works`,
`/limits`, `/install`, `/support`); the demo runs real code through the real
judge (naive O(n²) → 3/3 tests pass, 420ms against a 189ms gate, stays locked;
optimal → 110ms, passes); the desktop lock survives kill, crash, sleep and a
second monitor, with a hold-Escape kill switch; one-command VPS deploy with a
**tested** restore.

**Written but never compiled or run:** the Android native module — no JDK or
Android SDK on this machine. Treat every Android claim as unverified.

**Never done:** repo not pushed to GitHub; no release cut; no code-signing
certificate; auto-update never proven end to end; nothing deployed anywhere.

### Known open problems

1. **Grading fails in the containerised stack on Docker Desktop for Windows** —
   `Cannot find module '/work/main.js'`. The judge container's `/tmp` and the
   daemon's `/tmp` are not the same directory. Expected to work on Linux, but
   unconfirmed. Workaround: run the judge on the host.
2. **Rebooting defeats the desktop lock.** Lock state survives, but nothing
   launches CodeLock at login. Deliberately not wired until the relaunch loop is
   tested on hardware.
3. Three `apps/mobile/.expo/` files are tracked from a stray commit. Untrack
   with `git rm -r --cached apps/mobile/.expo`.
4. `eas.json` and `app.json` still carry Apple and EAS placeholders that only
   `eas init` and an Apple account can fill.

### How to run everything

```bash
npm run dev -w @codelock/judge
```

```bash
npm run dev:api
```

```bash
npm run dev:web
```

```bash
npm run dev -w @codelock/desktop
```

Web on `:3000`, API on `:4000`, judge on `:2358`. The desktop shell opens
`/dashboard`. Mobile: `cd apps/mobile && npx expo start --lan` — Expo Go cannot
load the native lock module, so it falls back to the soft-lock stub by design.

On this machine Electron needs `ELECTRON_CACHE=D:/Cowork/.electron-cache` (a
cross-drive rename fails otherwise), and the judge must run on the host rather
than inside compose.

### Working rules

- **Commit messages are exactly one lowercase word.** No body, no trailers, no
  AI attribution. `git commit -m "word"`.
- Verify before asserting — run it, show the output. "Should work" is not a
  result.
- Say what failed, plainly, and report what could not be verified.
- Match surrounding code style; comments explain *why*, not *what*.
- Never let a client decide it is unlocked. If a change would allow it, stop and
  flag it rather than shipping it.
- When something cannot be done honestly (iOS blocking, unsigned installers),
  change the copy rather than the claim.

### Likely next tasks

- Push to GitHub and cut the first release (`docs/LAUNCH.md` steps 1–5).
- Deploy free (`docs/FREE-HOSTING.md`).
- Port the dashboard to native desktop and mobile screens, then remove
  `/dashboard` and `/settings` from web. **Keep `/lock`** — the native shells
  load that route from the web app.
- Implement more of `docs/DESIGN-BRIEF.md` §1b: rank, personal bests, and the
  record-break moment.
