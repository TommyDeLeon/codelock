# Team handoff

Milestone: prerequisite-aware beginner progression. This file is the record the
milestone gate asks for: acceptance status, evidence with commands, actual
contributions, remaining risks, and the next action.

Supersedes `HANDOFF.md`, which remains for the earlier hints, capability and
retrieval work.

## Actual contributions

Recorded honestly, because the policy forbids claiming joint review that did
not happen.

**Codex (GPT, via the Codex CLI on the owner's ChatGPT login) — requirements
selection, delivered.** Read the README, `HANDOFF.md`, the Prisma schema, the
migration listing, and the selection, grading and help-recording services, then
produced acceptance criteria, a standards-applicability ruling, a testing
strategy, migration requirements, an interface contract, an out-of-scope list
and three risks. It changed no files and ran nothing, which was its assignment.

Two of its findings changed this work materially, and both came from code
Claude had not read:

1. `pickProblem()` in `apps/api/src/services/problemSelector.ts` deliberately
   drops restrictions when a candidate pool empties, ending at the whole active
   corpus. **This is the actual root cause of "questions beyond my current
   understanding", and a skill gate alone does not fix it.** Confirmed by
   reading the file: the ladder logs `selection relaxed: cooldown dropped`,
   then `pattern family dropped`, then `tier gate dropped`, then relaxes
   difficulty, then selects from everything active.
2. Prefer `text` plus a database `CHECK` constraint over adding values to a
   Postgres enum for the skill states, because enum additions cannot be
   dropped. This repository already carries that hazard from
   `20260911120000_capability_recorded`.

It also judged the milestone too large for one review and proposed cutting it
into Delivery A (curriculum, storage, trustworthy evidence, prerequisite-safe
selection, review, feedback) and Delivery B (the optional calibration).

**Claude — implementation and verification.** Inspection, the skill module, its
tests, the test-runner wiring, and the verification recorded below.

**Codex - review of the delivered implementation, delivered.** It read this
file, the skill module, its tests, the selector and the Prisma schema, and
returned nine findings with line citations. It stated plainly that it did not
run the tests, the typecheck or any query, so the numbers in the evidence table
below remain Claude's measurements, not independently reproduced ones.

Four of its findings were defects, all confirmed by reading the code and all
now fixed:

1. **`functions` was unreachable, and `combining` with it.** No corpus tag maps
   to `functions`, so it could only arrive as a prerequisite of `combining` -
   which requires it, making every combining problem two new skills at once and
   therefore permanently ineligible. A two-argument signature now introduces
   it. The walk test added for this fails with `never reachable: functions,
   combining` when the rule is removed.
2. **The tag map understated requirements, the unsafe direction for a gate.**
   `fn:string->string` with no tags reported `values` only, so text handling
   could be presented as a fair first problem. Any signature mentioning text
   now requires `strings`.
3. **Eligibility was filtered after the 25-problem sample**, in Claude's own
   first cut of the selector. A sample that happened to miss the eligible
   problems would report "nothing fair here" and relax a rung that did not need
   relaxing. The filter now runs over each rung's whole pool, on five small
   columns, before sampling.
4. **One solving occasion could count as two unaided solves.**
   `ACCEPTED_TOO_SLOW` followed by `ACCEPTED` is two accepted rows for one
   piece of work, which alone would demonstrate a skill. Episodes are now
   deduplicated per problem and session, keeping the earliest.

A fifth defect, low severity: the refusal sentence named the blocked
destination skill rather than the earliest one the learner could act on. Fixed,
with a test.

**Two further defects found by running the gate against the real database,
after Codex's review and after the unit tests were green.** Both were invisible
to pure tests because both depended on the shape of the actual corpus and an
actual solve history:

6. **Meeting a skill once counted as practising it.** Eligibility refused only
   skills in `not_introduced`, so a learner with all eight skills at one
   assisted solve had the whole 695-problem corpus judged fair — Tier 2
   included — and described as using only what they had already practised.
   Three of those skills had never been used unaided at all. A problem may now
   lean on a skill only once it has one unaided solve or two assisted ones, and
   still introduces at most one unfamiliar idea. The eligible pool went from
   695 to 43, all Tier 0.
7. **Ten Tier 0 tags mapped to nothing**, including `sets` and
   `deduplication`, so "count the distinct values" read as plain list work.
   Every tag on a Tier 0 problem now maps to a skill or is deliberately
   unmapped.

This is the argument for the diagnostic script: `apps/api/scripts/probe-gate.ts`
answers what the rules do against the real corpus, which is the question the
unit tests cannot ask. One further finding was a design question rather than a defect,
and its answer changed the storage plan - see the storage section below.

## Acceptance status

Delivered and verified:

- A finite skill path over the six requested groups, with an acyclic
  prerequisite graph checked by a test rather than asserted.
- The four required states, with `practised_with_help` covering both a hinted
  solve and a first unaided solve.
- One correct answer never demonstrates a skill. Two unaided solves are
  required, and no number of assisted solves can substitute.
- A skill due for review is not demoted and does not lose its solve count, so
  nothing downstream re-locks.
- Selection refuses any problem whose prerequisites are unmet, refuses more
  than one new skill at a time, and returns `null` from the scorer for anything
  ineligible so ranking cannot rank its way past a gate.

- **The skill gate is wired into `pickProblem()`.** Every rung of the fallback
  ladder now prefers problems whose prerequisites the learner has met, applied
  to the rung's whole pool before sampling. The gate is a preference, not a
  wall: when no rung offers a single eligible problem, one is served anyway and
  the return value says so.
- Skill state survives restarts, because it is derived rather than stored.

- **The learner is told why they got this problem.** The lock screen shows the
  sentence under the problem title, read back from the `PROBLEM_SERVED` log row
  rather than recomputed, so it says what was true when the lock engaged
  instead of a kinder answer derived later. An out-of-depth problem gets a
  longer note saying so, with no warning colour and no apology.

Not delivered:

- No calibration, no skill map, no collection of completed programs.
- No integration test of `pickProblem` itself. The gate's rules are unit
  tested; the query ladder around them is not, and that needs a disposable
  Postgres database.
- The out-of-depth branch of the lock screen has been unit tested but never
  seen in the running app, because arranging a learner with no eligible
  problem takes a corpus this one does not have.

## Storage: derived, not stored

The recorded plan was a new table using text plus a `CHECK` constraint. Skill
state is instead derived on each selection from records that already exist:
accepted submissions say what was solved, and `HINT_REVEALED` and
`DEBRIEF_OPENED` rows say which of those took help. Codex's ruling on the
change: derivation better satisfies the spirit of the earlier requirement,
since a value that is never stored needs no constraint, and a persisted
aggregate would not repair the quality of the underlying evidence anyway.

What this buys: no migration at all, existing history counted immediately with
no backfill, and no second source of truth to disagree with the first. What it
costs: two indexed queries and a replay per selection, bounded by
`REPLAY_LIMIT` at 500 solves.

Help is attributed only when it was recorded before the passing submission,
matching `readCapabilityEvidence`. Without that boundary a debrief opened after
a solve - the normal case - would make almost every solve look assisted.

## Evidence, with commands

Run from the repository root unless stated.

| Check | Command | Result |
|---|---|---|
| Types, all workspaces | `npm run typecheck` | clean |
| Unit tests | `npm test` | 56 pass, 0 fail, 13 suites |
| Live gate, real corpus | `npx tsx apps/api/scripts/probe-gate.ts` | 43 of 695 problems eligible, every one TIER_0 |
| Live API reports the fit | `curl localhost:4000/v1/problems/next` | `skillEligible: true`, `"builds on one new idea: loops, and when you actually need one"` |
| Lock screen shows it | armed a 5-minute lock, shortened it to now, engaged, read the rendered page | "Chosen for you because it builds on one new idea: loops, and when you actually need one." |
| The reachability test earns its place | remove the two-argument rule from `skillsRequiredBy`, re-run | fails: `never reachable: functions, combining` |
| Corpus tag survey | inspection script in apps/api | of 60 TIER_0 problems, 33 need loops, 30 need arrays, 1 is tagged conditionals |
| Ten-session walk | inspection script in apps/api | one new skill per session, order below |

The lock-screen check abandoned the lock afterwards to leave nothing blocking,
which recorded one failure against the owner's progress. Disclosed rather than
edited: correcting it would mean rewriting the history this product is built to
keep honestly.

The ten-session walk is the substantive evidence. Serving order for a learner
starting from nothing, each problem solved unaided:

| Session | Problem | New skill |
|---|---|---|
| 1 | last-digit | values |
| 2 | sum-comma-separated | strings |
| 3 | starts-with-vowel | comparisons |
| 4 | first-character | indexing |
| 5 | join-with-dashes | lists |
| 6 | sum-of-array | loops |

`sum-of-array` is the problem the old selector could serve first. It is now
sixth, after its five prerequisites. The eligible pool grows 1, 8, 9, 11, 14,
54 as skills land.

A deadlock found and fixed during that walk: demonstrating a skill needs two
unaided solves, and exactly one problem in the corpus needs `values` alone, so
requiring demonstration before unlocking anything served that one problem
forever. Unlocking now requires a prerequisite to have been *introduced*, while
`demonstrated` remains the bar for the skill itself.

## Testing decision

`node:test` with `node:assert/strict`, run through the `tsx` the repository
already depends on. No test framework was added. `apps/api` previously had no
test script and no test files; it now has `npm test` at both the package and
repository root. This matches Codex's recommendation and the policy's
constraint against adding unnecessary tools.

The tests are pure by construction: no database, no network, no disk. The
storage layer will need integration tests against a **disposable** Postgres
database, never the owner's `DATABASE_URL`.

## Standards actually applied

Applied: requirements before implementation; the smallest understandable
change, reusing `progression.ts`'s existing pure-predicate shape rather than
replacing it; behaviour-focused tests including empty, boundary and malformed
inputs; readable user-facing strings; additive-only data changes.

Ruled out for this milestone, with reasons: SLSA and OpenTelemetry entirely,
the former being a build-supply-chain concern and the latter contradicting the
README's no-telemetry position; OpenAPI tooling, since no OpenAPI document
exists and the repository uses shared TypeScript contracts with Zod; account
authentication and role-based access control, since this is an unauthenticated
loopback tool for one local user; and any compliance claim, since none has been
assessed.

## Remaining risks

Codex's findings that are not fixed, recorded rather than quietly dropped.

1. **Assistance evidence is best-effort, and unknown is read as unaided.** Hint
   reveals are written with `void recordStep(...)`, so a failed write lets a
   hinted solve look unaided. `LearningEvent.sessionId` is deliberately not a
   foreign key, and no constraint requires the event, submission and session to
   agree on user or problem. A practice solve has no session at all and is read
   as unaided, which is defensible - the hint and debrief routes exist only on
   the lock path, so practice has no help channel to have used - but it is a
   reading of absent evidence, not a record of it.
2. **Derived state can be reinterpreted by later edits.** Requirements are
   computed from a problem's current tags, signature and tier, so retagging the
   corpus silently rewrites what past solves proved. Deleting a problem
   cascades its submissions and erases that credit entirely. A stored snapshot
   would have frozen the old reading instead; neither behaviour is obviously
   right, and this one is at least recomputable.
3. **`pickProblem` itself is untested.** The one check Codex called cheapest is
   still not written: a fixture with one eligible easy problem and one
   ineligible hard one, exhaust the cooldown, remove the eligible one, then
   assert the result is an eligible fallback or an explicitly out-of-depth
   problem, never the hard one presented as fair. This needs a disposable
   Postgres database, never the owner's `DATABASE_URL`.

All four of the weak tests Codex named are now fixed: the threshold is
asserted rather than looped over, the two-new-skills fixture uses two
independently ready skills, the re-lock test checks a downstream skill and a
downstream problem, and the suite describing selection is renamed for what it
actually covers. A fifth suite was added to keep every reason readable as the
sentence the screen puts it in.

---

# Milestone: session-flow controls

Four controls on the lock screen, in the owner's words: too hard, too easy,
explain differently, and "I don't feel like it". None of them may shame, add
urgency, reset a streak, or record anything as mastery that was not.

## Actual contributions

**Codex — requirements selection, delivered.** Read this file, the lock routes,
the session lifecycle, the difficulty ladder, the skill modules, the lock
workspace and the schema, then produced acceptance criteria per control, a
ruling on skip, an honest-progress boundary, a storage decision, a testing
strategy, risks and a cheapest check. It changed no files and ran nothing.

Three of its requirements overturned Claude's first draft, which had already
been written:

1. **Do not reset attempts on a swap.** Claude's draft reset them. A reset count
   makes the next solve a first-try solve, so "too easy" became a way to farm
   promotions. Replaced by: a session where the learner swapped is counted in
   the solved and failed totals but never promotes or demotes.
2. **Refuse rather than serve something unsuitable.** Claude's draft fell back to
   any active problem, on the reasoning that a failed control is worse than an
   imperfect swap. Codex's distinction holds: unlike selection at lock time, an
   empty pool here leaves the learner on a problem they can still get hints for.
3. **Explanation is help, and must be recorded before it is shown**, with a write
   that fails loudly. The ordinary log writer swallows errors, and help that was
   not written down reads later as an unaided solve.

Codex also required participation to end the lock as its own outcome rather
than a skip, and justified two forward-only enum values for it.

**Claude — implementation and verification**, recorded below.

**Codex — first review of the implementation, delivered: NOT APPROVE.** Seven
findings. Four shared one root cause: a session's current problem had no
identity beyond its id.

| # | Severity | Finding | Fix |
|---|---|---|---|
| 1 | High | Swaps were inferred from counting fire-and-forget log rows, so a lost row removed ladder protection | `lock_sessions.adjusted`, set in the same conditional update as the swap |
| 2 | High | Submit A, swap to B, swap back to A: the first A's result could release the lock | `problemRevision` on the session and on each submission; release requires both to match |
| 3 | Medium | Participation's transition, event and audit were written separately | One transaction |
| 4 | Medium | Too hard or too easy fell back to the current band | Only the requested band; same band only at the ends of the ladder, labelled as such |
| 5 | Medium | The fit note was read from the latest row regardless of problem | Matched to the current problem |
| 6 | Medium | Participation was not bound to the offered example | The offer returns a revision and completion requires it |
| 7 | Medium | No tests for persistence, rollback or races | See below |

**Codex — second review: NOT APPROVE.** Findings 2 to 6 fixed, 1 partially fixed,
7 not fixed. One new high-severity defect: the migration defaulted `adjusted` to
false for every existing row, so a session swapped before the upgrade and still
locked would lose its protection. Fixed by a separate backfill migration, because
an applied migration must not be edited. Two smaller points also fixed:
`releaseLock` now refuses a problem id without a revision, and the fit note is
matched to the revision as well as the problem.

**Codex — final review: PENDING.**

## Acceptance status

Delivered:

- **Too hard and too easy** swap the problem under a live lock, one difficulty
  band from the problem on screen, only to a problem the skill gate calls
  ready, and refuse when none exists. No skip is spent and the lock stays up.
- **Say it differently** restates the problem from its signature and first real
  example, derived rather than generated. It is recorded as a hint before it is
  returned, so a later solve counts as helped.
- **Not tonight** shows one worked example with its answer visible and asks for a
  response in the learner's own words. Any response ends the lock as
  `PARTICIPATED`: no skip spent, no re-arm, no solve, no capability, no skill
  credit, no change to progress.
- **An adjusted session is counted but not measured.** Solves and failures still
  go into the totals; nothing else on the ladder moves.
- **A stale result cannot release a replaced assignment**, including after
  swapping back to the same problem.
- Help attribution is scoped to the problem as well as the session, in both the
  capability record and the skill snapshot.
- Drafts are scoped to the problem, and the workspace remounts on a swap.

Not verified:

- **No real lock was armed after the owner came home.** The desktop app may have
  been running, and a test lock would have blocked the screen. The controls have
  therefore not been seen rendered in the running app, and the desktop shell's
  handling of a participation release is unverified.
- The route-level flow is exercised by the database tests through the services,
  not through HTTP.

## Evidence, with commands

Run from `apps/api` unless stated.

| Check | Command | Result |
|---|---|---|
| Types, all workspaces | `npm run typecheck` from the root | clean |
| Pure tests | `npm test` | 77 pass, 0 fail |
| Database tests | `DATABASE_URL=…/codelock_test JWT_UNLOCK_SECRET=… npm run test:db` | 7 pass, 0 fail |
| The race test is not vacuous | remove the revision condition from `claimResolution` and `releaseLock`, re-run | exactly the A-to-B-to-A test fails; file restored with a zero-line diff |
| Migrations applied | `prisma migrate deploy` on the owner's database and on `codelock_test` | both current, 25 of 25 |
| No live session lost protection | query after the backfill | 0 adjusted sessions, 0 locked sessions |
| Live API validates the route | `POST /v1/lock/<id>/flow` with a bad action, a negative revision, an unknown session | validation error, validation error, not found |

The database tests refuse to run unless the database name ends in `_test`. They
create and delete their own rows and never touch the owner's data.

## Remaining risks

1. **Two enum values are permanent.** `SESSION_FLOW` and `PARTICIPATED` cannot be
   removed from Postgres. The migration says so.
2. **The existing ladder still resets streaks.** `applyOutcome` resets fast-solve
   counters on a slow solve and its message says "streak reset". Codex flagged
   this as contradicting the owner's constraint. The new controls never reach
   that path, but the ordinary solve path does. Out of scope for this milestone
   and not changed.
3. **The daily skip boundary uses server-local midnight**, not the learner's stored
   timezone. Existing behaviour, recorded by Codex, not changed.
4. **Offering the warm-up writes its log row fire-and-forget.** Only completion
   is confirmed and transactional, which is the row that matters; an offer that
   was opened and closed may go unrecorded.

## Next action

Test the four controls on a real lock in the desktop app. Then the capability
sentence, which is still stored and shown nowhere, and the skill map behind it.
