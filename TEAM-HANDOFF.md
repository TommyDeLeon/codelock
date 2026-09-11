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

**Joint review of the implementation: PENDING.** Codex reviewed requirements
before the work. It has not yet reviewed the delivered code or this evidence.

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

Not delivered, so the milestone is incomplete:

- **The skill gate is not wired into `pickProblem()`.** Until it is, and until
  the fallback ladder is made prerequisite-safe, the running app can still
  serve an unready problem. This is the next action.
- No storage: skill state is computed but not persisted, so nothing survives a
  restart yet.
- No API surface, no web presentation, no calibration.

## Evidence, with commands

Run from the repository root unless stated.

| Check | Command | Result |
|---|---|---|
| Types, all workspaces | `npm run typecheck` | clean |
| Unit tests | `npm test` | 29 pass, 0 fail, 6 suites |
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

1. **The fallback ladder can still serve an unready problem.** Highest
   severity. Cheapest check, from Codex: a fixture with one eligible easy
   problem and one ineligible hard one, exhaust the cooldown, remove the
   eligible one, then assert the result is either an eligible fallback or an
   explicit no-eligible-activity error, never the hard problem.
2. **Assistance evidence is best-effort.** Hint reveals are written with
   `void recordStep(...)`, so a failed write could let a hinted solve look
   unaided. The skill layer already refuses to demonstrate from assisted
   solves, but it trusts the assisted flag it is given.
3. **No persistence yet**, so none of the above is observable in the running
   app.

## Next action

Wire `skills.ts` into `pickProblem()` and make the fallback ladder
prerequisite-safe: it may relax cooldown, family, difficulty and tier, but it
must never relax the skill gate, and an empty prerequisite-safe pool must
surface an explicit unavailable result rather than a harder problem. Then
persist skill state in an additive table using text plus a `CHECK` constraint.
