# Handoff — reward and stretch (2026-09-16)

Follows the tutor and success-moment handoff below. Design:
`docs/reward-and-stretch.md`. Evidence: `RESEARCH.md`, "Reward and
difficulty (2026-09-16)".

## The bug, reproduced and fixed

On 2026-09-15 the owner's history showed 13 locks, 8 distinct problems, three
of them served two or three times the same day. Every repeat came through a
`too_hard` swap: `chooseReplacement` excluded only the problem on screen, and
its "too hard" score ranked fully-practised problems highest. The 21-day
cooldown at lock time keyed on submissions, so a mastered problem would have
returned at full weight on day 22.

- **`apps/api/src/services/repetition.ts`** (new, pure + one loader): a problem
  stays out of full locks while attempted within 21 days *or* solved with every
  skill still `demonstrated`. Only a skill falling due lifts it. Used by both
  `pickProblem` and `swapProblem`. A swap whose pool empties refuses; the
  problem on screen still opens the lock.
- Tests: `repetition.test.ts`; `sessionFlow.test.ts` ("a swap never walks back
  to a problem already solved", written red first).

## What exists now

- **`stretch.ts`** (new, pure): fair rows split into *stretch* (needs a skill
  not yet demonstrated) and *consolidating*; a lock draws stretch with fixed
  weight 0.8; one consolidating lock after two stretch locks that ended in a
  worked solution, bypass or abandon. `pickProblem` returns `pool`, recorded in
  the `PROBLEM_SERVED` event detail. Every fallback rung is unchanged.
- **`tutor/reward.ts`** (new, pure): `deriveRewardEvents` →
  `skill_demonstrated | first_unaided | review_held | near_miss_improved |
  transfer | recall | solved`; `chooseSurface` is `full` only when something
  rarer than `solved` fired — no random draw. `Accomplishment` gains `events`
  and `surface`.
- **Review is never a lock**: when a skill is due, `deriveAccomplishment`
  offers the oldest unaided solved problem on it in the existing `variation`
  slot after the lock opens.
- **Near miss**: `grading.ts` compares a failed attempt with the previous one
  in the session on the same problem; once per problem per session; returned
  as `nearMiss` and stored in the `ATTEMPT_FAILED` detail.
- **`frontier.ts`** (new, pure + loader): `GET /v1/progress` gains `frontier`
  — next skill, distance in words, what the last attempt on it proved, and
  first-try pass rate over the last 20 locks beside the 75–85% band. Shown,
  never acted on.
- **Web**: `success-moment.tsx` waits for the surface before motion or chime;
  quiet shows headline + one detail. `test-results.tsx` shows the near-miss
  line. The fit line on the problem panel already existed.
- **Desktop**: `celebration.tsx` gates motion/chime/skill chips on the surface;
  `screens/progress.tsx` shows the frontier above the skill map.
- **`apps/api/scripts/replay-selection.ts`**: read-only replay and the
  measurements in the design doc.

No schema change. No change to `ladder.ts`, `diagnose.ts`, `starter.ts`, the
hint levels, or `apps/mobile`.

## Replay on the owner's real history

Before: stretch 32%, mastered-only 69%; `too_hard` shortlist 6/8 already
solved. After: stretch 77–82% across runs, mastered-only 18–23%, repeats of
solved 0%, out-of-depth 0%; `too_hard` shortlist 0/4 solved. Real locks so far
carry no recorded pool (the field is new), so per-pool pass rates start
accumulating from the next lock.

## Providers

- **Claude (Opus 5):** coordinated, researched, designed, implemented.
- **OpenAI Codex** (`codex-rescue`, read-only): Phase 1 trace of the selector
  agreed with the DB replay (H2, H3, H4 confirmed; H1 reframed as "the picker
  never preferred the frontier"). The Phase 5 diff review **did not complete**:
  Codex hit its usage limit mid-run (resets 2026-09-19). One partial finding —
  that the near-miss acknowledgment is scoped per problem — matched a fix
  already applied. Re-run the review after the reset.
- **Gemini** (`gemini-3.1-pro-low` via `agy`, plan mode): adversarial critique
  of the design against the research, 12 points; each adopted or rebutted in
  `docs/reward-and-stretch.md`. Adopted: static weight, relief rule, no random
  surface draw, review as a real retrieval, distance in words, near-miss once
  per session, drop `faster_than_own` and `fewer_hints`, three new
  measurements. Rebutted: a cap on swaps; optimising time on screen.
- **ECC typescript-reviewer:** 5 findings, all addressed (near-miss scoped per
  problem, served-records read bounded by distinct problems, type-guard filter
  in `dueReview`, shadowed `pool` renamed, JSON `pool` guarded).
- **ECC react-reviewer:** 6 findings; 4 addressed (non-null assertion, list
  `aria-label`, `aria-live` on the near-miss line, single prefs read). Two left
  as pre-existing or speculative (text keys on details; frontier copy styling).

## Verify

```bash
npm run typecheck
```

```bash
npm test -w @codelock/api
```

Replay selection and the measurements against the local database:

```bash
cd apps/api && LOG_LEVEL=silent npx tsx --env-file-if-exists=.env scripts/replay-selection.ts 300
```



## Open limitations

- **Lint:** `npm run lint` fails in `apps/web` before this change — ESLint 10
  finds no `eslint.config.*`. Not touched here.
- **Corpus gap at the frontier:** only two EASY problems introduce `lists`
  alone; the stretch pool at the owner's current edge is those two. The replay
  shows it. More one-new-idea problems around `lists` and `loops` would widen
  it.
- **Pass rate is a bet:** the 75–85% band is an analogy from gradient-descent
  classifiers; it is displayed and measured, never tuned toward.
- **No web Progress page:** the frontier is on the desktop Progress tab and in
  the API; the web app has no progress page to show it on.
- **Desktop shell** still drops the overlay to its dashboard; the quiet/full
  surface applies there through `celebration.tsx`.

---

# Handoff — tutor hints and success moment (2026-09-15)

## What exists

### Hints

All hint logic lives in `apps/api/src/services/tutor/`. It is rule-based and
needs no AI connection.

- **`diagnose.ts`** reads the current code and the real results on sample
  cases, and labels each finding confirmed, likely or possible.
- **`ladder.ts`** builds five levels: question, trace, concept, outline with
  one gap, worked solution. It also handles "didn't help", "explain word",
  "step by step", "smaller example" and "different explanation".
- **`starter.ts`** holds reviewed content and reference tracers for 6 starter
  problems. Every tracer is tested against every test case.
- **`POST /v1/tutor/hint`** runs the current code on sample cases only. It
  re-runs a hidden failure against the current code, and records the hint
  (awaited) before responding.
- **`POST /v1/tutor/feedback`** stores optional feedback.

### Success moment

- **`successMoment.ts` and `accomplishment.ts`** work out what the solve
  showed. They run after the unlock and never delay it.
- The result is saved as an `ACCOMPLISHMENT` event and read from
  `GET /v1/progress/accomplishment/:id`.

### Desktop

- A **Progress** tab shows the skill map and recent solves, with help and
  independent work counted separately.

### Web

- The lock screen's `hints-panel.tsx` is rewritten and `success-moment.tsx` is added.
  The desktop app loads this lock screen. No other web pages were added.

### Recording fixes

- Practice help and a recently opened debrief now count as help.
- The legacy lock hint is recorded awaited.
- A solve after hints no longer counts as mastery.
- A level-5 worked solution now counts as seeing the editorial.

### Database

Migration `20260915090000_tutor_feedback` adds `ACCOMPLISHMENT` and `FEEDBACK`.

## Providers

- **Claude (Opus 5):** coordinated and implemented.
- **OpenAI Codex** (`gpt-5.6-sol`, medium, read-only):
  - Inspected the runner and learning logic before implementation.
  - Reviewed the implementation afterwards and raised 7 actionable findings.
    All 7 are fixed.
- **Gemini** (`gemini-3.1-pro-low` via `agy`, plan mode):
  - Critiqued the baseline hints, then the real generated hints and the success
    copy.
  - Its jargon and pressure fixes were adopted.
  - One suggestion was rejected: "NEW FEATURE UNLOCKED", as gamified.

## Verify

Unit tests, including the real-judge evaluation set:

```bash
npm test -w @codelock/api
```

Typecheck the API:

```bash
npm run typecheck -w @codelock/api
```

Typecheck the web app:

```bash
npm run typecheck -w @codelock/web
```

Re-record the real judge runs (needs the Docker stack up):

```bash
npm run record:hint-fixtures -w @codelock/api
```

Print real hint ladders for review:

```bash
npm run hints:samples -w @codelock/api -- samples.md
```

## Open limitations

- **Desktop shell:** it drops the overlay straight to its bundled dashboard, so
  the success screen only appears in the browser flow. Progress is still saved
  and shown on the desktop app's Progress tab.
- **Understanding:** nobody has measured whether beginners actually understand
  the hints.
- **Coverage:** reviewed starter content exists for 6 problems only. The rest
  get rule-based hints.
- **Traces:** they come from a checked reference solution, not a step trace of
  the learner's own code.
- **Languages:** the evaluation uses Python, JavaScript and Java only.
- **Legacy route:** `/lock/:id/hint` still exists but the web app no longer
  uses it.
