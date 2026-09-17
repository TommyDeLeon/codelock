# Handoff — reward, stretch and corpus growth (2026-09-16 → 17)

## The problem

After the success moment shipped, the app re-served solved problems and the
learner's skill level stopped moving. Replayed against the owner's own local
database: thirteen locks on 2026-09-15, eight distinct problems, three of
them served two or three times in one day.

## Root cause (reproduced by tests first, then fixed)

- **Every repeat came through a `too_hard` swap.** `chooseReplacement`
  excluded only the problem on screen, and its "too hard" ranking rewards
  fully-practised problems — so a problem solved that morning ranked highest.
  Shortlist before the fix: 6 of 8 already solved; after: 0.
- **The 21-day cooldown keyed on submissions, not mastery.** A solved problem
  whose skills were all demonstrated was due back at full weight on day 22.
  Latent in the history, fixed with the same rule.
- **Due-for-review had no distinct treatment**; nothing in selection
  distinguished review from new work. Now review is never a lock.
- **The progression gate itself was not stuck.** The picker used
  `fitForLearner` as a boolean and then chose by problem value, so mastered
  and frontier problems had the same chance. Replay of 200 picks: 69%
  mastered-only, 32% stretch.

Tests: `apps/api/src/services/repetition.test.ts`,
`sessionFlow.test.ts` ("a swap never walks back…"), `stretch.test.ts`,
`tutor/reward.test.ts`, `frontier.test.ts`, `tutor/accomplishment.test.ts`.

## What exists now

### API

- **`services/repetition.ts`** — a problem stays out of full locks while
  attempted within 21 days, or solved with every required skill still
  `demonstrated`. Only a skill falling due lifts it. Used by `pickProblem`
  and `swapProblem`. Swaps refuse rather than repeat; the on-screen problem
  still opens the lock.
- **`services/stretch.ts`** — the fair pool of each rung is split into
  *stretch* (needs a skill not yet demonstrated) and *consolidating*; the lock
  draws stretch with a fixed 0.8. One consolidating lock after two stretch
  locks that ended in the worked solution, a bypass or an abandon. The pool
  is recorded in the `PROBLEM_SERVED` event detail (JSON; no schema change).
  Every fallback rung in `pickProblem` is unchanged: the lock always opens.
- **`services/sessionFlow.ts`** — `too_hard` prefers a smaller stretch
  problem; consolidating only when no stretch problem fits. No cap on swaps
  (the owner's standing decision).
- **`services/tutor/reward.ts`** — pure `deriveRewardEvents` →
  `skill_demonstrated | first_unaided | review_held | transfer | recall |
  solved`, and `chooseSurface`: `full` only when something rarer than a solve
  happened, otherwise `quiet`. No random draw. `nearMissImproved` for failed
  attempts, once per problem per session.
- **`services/tutor/accomplishment.ts`** — `Accomplishment` gains `events`
  and `surface`. When a skill is due for review, the follow-up `variation`
  slot offers the oldest solved problem on that skill as an optional graded
  retrieval.
- **`services/grading.ts`** — failed attempts carry `nearMiss` in the
  response and in the `ATTEMPT_FAILED` detail.
- **`services/frontier.ts`** and **`GET /v1/progress`** — `frontier`: next
  skill, distance in words, what the last attempt on it proved, first-try
  pass rate over the last 20 locks beside the 75–85% band. Measured, never
  acted on.
- **`scripts/replay-selection.ts`** — read-only replay of selection plus the
  measurements the design asks for.

### Shared types

`RewardEvent`, `RewardSurface`, `NearMiss`, `FrontierView`; optional fields on
`Accomplishment`, `GradeResult`, `ProgressView` so older rows and servers
keep working.

### Web

- `success-moment.tsx`: motion and chime wait until the surface is known;
  `quiet` shows the headline and one detail, no motion, no chime, no skill
  map. Reduce-motion and the sound preference are respected as before.
- `test-results.tsx`: one plain near-miss line under a failed result.
- `problem-panel.tsx` already showed the fit line for eligible problems
  ("Chosen for you because it builds on one new idea: lists").
- There is no web Progress page; the Progress tab is desktop-only.

### Desktop

- `screens/progress.tsx`: "What is next" block above the skill map.
- `celebration.tsx`: same surface rule as the web moment.

### Database

No schema change. New facts live in existing JSON `detail` columns.

## Replay on the owner's real history (`scripts/replay-selection.ts`)

| | before | after |
|---|---|---|
| picks needing an undemonstrated skill | 32% | 82% |
| picks needing only demonstrated skills | 69% | 18% |
| repeats of solved problems (lock pick) | 0% | 0% |
| `too_hard` shortlist already solved | 6 of 8 | 0 of 4 |
| out-of-depth picks | 0% | 0% |

Per-pool first-try pass, time-to-solve and hint level are reported from the
next locks on, since the pool was not recorded before this change.

## Providers

- **Claude (Opus 5):** traced the bug against the local database, wrote the
  failing tests and the fixes, did the research pass (12 sources, tagged in
  RESEARCH.md), wrote the design, implemented all three surfaces, and
  addressed every review finding below.
- **OpenAI Codex** (`codex:codex-rescue`, read-only):
  - Phase 1: independent trace of the selector, skill state, session flow
    and progression gate. Verdicts matched: H2/H3/H4 confirmed, H1 killed as
    stated (tiers do advance; the picker never preferred the frontier).
  - Phase 5: **the diff review did not run.** Codex hit its usage limit
    ("try again at Sep 19th, 2026") before producing output. No credits were
    bought and no other provider was substituted for it. Re-run after the
    reset: `codex:codex-rescue` on the diff of commit `stretch`.
- **Gemini** (`gemini-3.1-pro-low` via `agy`, plan mode, read-only):
  adversarial critique of `docs/reward-and-stretch.md` against the research.
  Twelve points; each adopted or rebutted in writing at the end of that
  document. Adopted, among others: no random full-celebration draw, static
  0.8 weight, relief rule, `faster_than_own` and `fewer_hints` dropped,
  near miss once per problem per session, review as a real graded solve.
  Rejected: a cap on swaps.
- **ECC `typescript-reviewer`:** 7 findings. Fixed: unbounded submissions
  read on the selection path (now two aggregates bounded by distinct
  problems); `nearMiss` validated at the loader boundary instead of cast;
  one-pass fit computation in `rankReplacements`. Not changed: `recordStep`
  already catches internally, so a `.catch` would be redundant; the
  read-then-write race on the near-miss acknowledgement is documented in
  `grading.ts` and accepted for a single-user tool.
- **ECC `react-reviewer`:** 5 findings. Fixed: the chime could play on a
  later sound-preference toggle (now fires once, on the moment becoming
  full); the near-miss live region is always in the tree so it is announced;
  `surface`/`events` are validated on both web and desktop so an unknown
  value never defaults to motion and sound. Not changed: module-level
  `animated`/`chimed` in `celebration.tsx` predate this change and were only
  gated, not restructured; the help-used line stays on the quiet surface as
  the record of the solve (documented in the design).

## Verify

All API tests (332), including the regressions for the repetition bug:

```bash
npm test -w @codelock/api
```

Typecheck every workspace:

```bash
npm run typecheck -w @codelock/shared -w @codelock/api -w @codelock/web -w @codelock/desktop
```

Replay selection against the local history (read-only; needs the Docker
stack up) and print pool share, repeats, per-pool pass rate, per-problem
stretch difficulty, active days and the frontier block:

```bash
LOG_LEVEL=silent npx tsx --env-file-if-exists=.env apps/api/scripts/replay-selection.ts 300
```

## Open limitations

- **Codex diff review outstanding** (see Providers).
- **Web lint** fails to start: ESLint 10 with no `eslint.config.*` in
  `apps/web`. Pre-existing; not touched in this pass.
- **Pool history starts now.** Per-pool pass rate, time and hint level only
  exist for locks served after this change; the replay labels older locks
  `unrecorded`.
- **Review offers depend on due skills.** Nothing is due yet in the local
  history (`SKILL_REVIEW_DAYS = 7`), so the follow-up review offer has been
  exercised only by unit test, not in the running app. The growing review
  interval described in the design (doubling, capped at eight weeks) is not
  implemented; the fixed 7-day rule in `skillState.ts` stands.
- **Stretch pool is thin at the owner's frontier:** two EASY problems
  introduce `lists`. The replay serves them 82% of the time, which is the
  target, but the corpus is what limits variety there.
- **Not measured:** whether any of this changes how the app feels. The
  design's bets are listed as bets in RESEARCH.md, with what each would take
  to test.
- **Desktop shell** still drops the overlay to its dashboard; the success
  moment there is the dashboard celebration, which now follows the same
  surface rule.
- **Not touched:** `tutor/ladder.ts`, `diagnose.ts`, `starter.ts`, the hint
  level scheme, the DB schema, `apps/mobile`.

## Growing the corpus (2026-09-16, later the same day)

The owner wants the library at LeetCode scale (4,055 problems) and level,
including the patterns behind premium-locked problems. Two things were
decided and one refused:

- **Refused:** copying LeetCode statements or test data, premium or free.
  Copyrighted, and the corpus is CC0.
- **Decided:** use LeetCode's public problem *index* — title, slug,
  difficulty, `paid_only` — as a coverage map only, and author an original
  problem per entry on the same technique at the same difficulty. Locked
  entries are covered the same way: their title and difficulty are public.
- **Decided:** every generated problem is admitted only after all six
  reference solutions pass every test on the judge, through the grader's own
  drivers, and carries `provenance: GENERATED` (never presented as
  hand-authored).

### `scripts/author-batch.ts` (`npm run author:batch -w @codelock/api`)

Gemini (`gemini-3.1-pro-low` via `agy`, schema-enforced JSON, brief passed
as a file because of the Windows argv limit) drafts; local checks reject
unknown signatures/tags/families, missing Constraints/Examples, site
mentions, and titles that merely rename an anchor; the judge rejects any
failing solution; Codex (`codex exec --sandbox read-only`) optionally reads
surviving statements for ambiguity and is recorded as SKIPPED when
unavailable. Survivors are written to `src/corpus/problems/gen-*.ts` and
registered in `index.ts`; anchored runs update `src/corpus/coverage.json`.

Two modes: `--family/--tier/--difficulty` or `--anchors <index.json>`. Batch
size defaults to 6: at 20, drafts lost their examples and slid to Tier 0
difficulty (0 of 20 accepted); at 5–6, 4 of 5 and 4 of 6 were admitted.

The judge is not published to the host by Compose; `npm run judge:host`
starts a second instance of the built image on `127.0.0.1:2358` (same
socket mount as Compose — stop it with `judge:host:stop` when done).

### Pipeline as it runs now (2026-09-17)

The index was saved by hand to `data/leetcode-index.json` (gitignored;
metadata only). Anchors are taken easy-first, sharded across workers by an
FNV hash of the slug (`--shard k/N`), so five workers never draft the same
anchor. Every batch: draft (6 anchors) → local checks → judge, all six
languages → one repair round for judge rejections → statement review by
Codex plus a second reader from the other pool (`--review-model`; chain
falls through to `gpt-oss-120b-medium`, then `gemini-3.8-flash-medium` /
`claude-sonnet-4-6`) → flagged statements rewritten once or dropped. A
batch nobody could read exits 3 with `"unreviewed"` in the summary and the
loop waits 15 minutes instead of drafting more. Zero-yield batches still
record their anchors in `coverage.json` (`ours: null`, `reason`) so the
loop advances.

Scripts (all under `apps/api/scripts/`, logs in `author-out/`, shared log
`author-loop.log`, stop file `.author-stop`, locks `src/corpus/.author-lock`
and `scripts/.author-gitlock`):

- `author-loop.sh START ANCHORS SHARD MODEL` — anchored batches forever;
  commits `corpus` every 5 batches. Quota errors are parsed ("Resets in
  1h15m") and the worker sleeps until the reset — it never switches model,
  per the owner.
- `upgrade-statements.ts` / `upgrade-loop.sh SHARD MODEL` — rewrites the
  hand-authored statements into the same interview format, as an overlay in
  `src/corpus/upgrades.ts` applied at load (`upgrade.ts`); the originals are
  untouched. Review with one rewrite-with-notes attempt, then `skipped`
  (original kept). Commits `statements`.
- `refresh-tests.ts` / `refresh-loop.sh` — for upgrades skipped as
  "closely follows", the model proposes ≥10 inputs, all six references run on
  the judge, inputs where all agree become replacement `tests` in the
  overlay. Commits `tests`.
- `sweep-coverage.py [--apply]` — returns anchors whose draft passed the
  judge but was dropped only because the rewrite/repair call hit a quota.
  Run after each quota window.
- `judge-watchdog.sh` — restarts the host judge when `queued>0 && active==0`
  for 5 minutes. `npm run judge:host` publishes the judge on
  `127.0.0.1:2358` (`JUDGE_CONCURRENCY=10`).

Fleet as left running: w0/w2/w4 Gemini, w1/w3 Claude (`claude-sonnet-4-6`),
up0 Gemini, up1 Claude, rf Gemini, watchdog. Codex `codex exec` reviews
every batch when its 5-hour cap allows. Throughput with five workers sharing
one judge is about 60 anchors an hour while quotas last; Gemini and Claude
each deplete a 5-hour window in roughly 90 minutes of drafting.

Counts at handoff: 384 anchors covered, 57 set aside (missing signatures
such as `fn:matrix,int->bool` and `fn:strings->ints`, which the owner chose
not to add; site mentions; anchors too close to the drafted title), 233 of
695 originals upgraded (11 `skipped`, 16 with refreshed tests). Two batches
were admitted without statement review before the `unreviewed` gate
existed: see `scripts/needs-review.txt` (7 problems) — read them by hand or
re-run the reviewer on them.

### Frontier

`GET /v1/progress` → `frontier.nearestInterview`: the Tier 1 problem with the
fewest undemonstrated skills and which skills they are. For the owner today:
"First Solo Guest — 4 skills away: lists, loops, functions, combining."

### Outstanding

- Keep the loops running until "every anchor in the index is covered";
  re-run `sweep-coverage.py --apply` after quota windows.
- Review `scripts/needs-review.txt`.
- `GENERATED` problems have no reviewed starter hint content; they get the
  rule-based ladder like the rest of the corpus.
