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
with a test. One further finding was a design question rather than a defect,
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

Not delivered:

- No web presentation. The selector returns `skillEligible` and `skillNote`,
  the practice route reports both, and the lock path writes them into the
  `PROBLEM_SERVED` log row. Nothing shows them to the learner yet.
- No calibration, no skill map, no collection of completed programs.
- No integration test of `pickProblem` itself. The gate's rules are unit
  tested; the query ladder around them is not, and that needs a disposable
  Postgres database.

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
| Unit tests | `npm test` | 48 pass, 0 fail, 11 suites |
| The reachability test earns its place | remove the two-argument rule from `skillsRequiredBy`, re-run | fails: `never reachable: functions, combining` |
| Corpus tag survey | inspection script in apps/api | of 60 TIER_0 problems, 33 need loops, 30 need arrays, 1 is tagged conditionals |
| Ten-session walk | inspection script in apps/api | one new skill per session, order below |

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
3. **Several of the original 29 tests assert less than their names suggest.**
   Codex named four: a threshold loop that would pass if the constant changed,
   a two-new-skills fixture that does not test two independently ready skills,
   a "nothing downstream re-locks" test that never checks a downstream skill,
   and tests described as covering selection that only exercise the pure
   predicate. Not yet revised.
4. **`pickProblem` itself is untested.** The one check Codex called cheapest is
   still not written: a fixture with one eligible easy problem and one
   ineligible hard one, exhaust the cooldown, remove the eligible one, then
   assert the result is an eligible fallback or an explicitly out-of-depth
   problem, never the hard one presented as fair. This needs a disposable
   Postgres database, never the owner's `DATABASE_URL`.

## Next action

Show the learner what the selector now knows: surface `skillNote` and the
stored capability sentence in the app, and the skill map behind them. Then the
session-flow controls - too hard, too easy, explain differently, low energy.
