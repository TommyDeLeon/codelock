# Hand-off — the corpus project

Read cold. This covers the seven-phase corpus and value-ranker work that
`HANDOFF-2026-08-30.md` listed as "not started". All of it is committed:
`corpus`, `schema`, `ranker`, `selection`, `progression`, `importer`, `memory`.

```
npm test           1096 passing / 31 files   (api 1010 · desktop 67 · judge 15 · web 4)
npm run typecheck  clean across the workspace
```

---

## The short version

The **machinery** is built, tested and wired end to end. The **corpus is under
way**: 86 problems are authored, judge-verified and active against a target of
~695 (plus 3 legacy rows, so 89 active in the database). That gap is the
whole of what remains, and it is deliberate — authoring against a signature
registry that had not been proven in six languages would have been the expensive
mistake.

Concretely: adding problem 13 now costs a data literal and an importer run.
Adding problem 13 *before* Phase 2 would have cost a hand-written harness in six
languages.

---

## What is done, phase by phase

**Phase 1 — licensing.** `docs/CORPUS-SOURCES.md`. Every licence read from its
canonical URL; anything unconfirmed is marked **unverified** rather than
guessed. Cleared for the free tier: CodeContests (CC BY 4.0, ships test cases),
MBPP (CC BY 4.0, best fit for Tier 0), HumanEval (MIT). `data/` tier only:
Project Euler (CC BY-NC-SA), freeCodeCamp curriculum (CC BY-SA). Excluded:
LeetCode (proprietary), CSES (no licence stated — silence is not permission),
Rosetta Code (GFDL 1.2, excluded on practical grounds). **Blocked: APPS** — the
repo badge says MIT but the README says nothing about statement redistribution,
and that is the single most likely place to acquire an infringement quietly.
Draft permission emails are in the doc, unsent.

**Phase 2 — the signature registry.** `src/corpus/`. 58 signatures (43 free
function, 15 class) generating drivers and starter stubs for six languages from
per-language type codecs. The arithmetic the brief asked for holds: ~695
problems cost ~58 harnesses, not 695.

The **operation-log driver** — the only one that instantiates a user class and
replays a command list — passes standalone in all six languages, before any
Tier 0.5 problem exists:

```
npm run verify:drivers -w @codelock/api     ->  18/18 passed
```

It uses **generated dispatch, not reflection**. Java and Go could reflect; C++
cannot, and a driver that works in five languages silently excludes C++ users
from an entire tier.

**Phase 3 — schema.** Two migrations. `Tier`, `PatternFamily`, the provenance
quintuple, pattern tags, `signatureId`, editorial fields, `referenceSolution`,
and all six ranker components stored individually.

**Phase 4 — the ranker.** `src/services/valueRanker.ts`, pure, 24 tests. The
brief's formula exactly, with `explanationQuality` **positive**. A
single-published-answer problem falls out of the unlock pool through
`answerLookupRisk`, not through a branch naming Project Euler — the test proves
it using a source called `some-future-corpus`.

**Phase 5 — progression and debrief.** `src/services/progression.ts` extends the
difficulty engine rather than replacing it: `applyOutcome` still owns
EASY/MEDIUM/HARD, and this only narrows which *pool* that draws from. A
brand-new user's first five locks are Tier 0, unconditionally. Structures gate
the families that need them — build the heap before heap problems.

`GET /lock/:id/debrief` returns the pattern, editorial and worked solution, and
refuses while the session is live. `toPublicProblem` never carries those fields
at all, so the debrief is the only path to them.

**Phase 6 — selection.** `src/services/valueSelection.ts` buckets S/A/B/C at
8/5/3/1, asserted over 1000 seeded draws rather than one pick. Popularity
survives as a bounded 2x tiebreak — unbounded, like counts spanning orders of
magnitude would have made the rank weights decoration.

**Phase 7 — ingestion.** `npm run import:corpus -w @codelock/api -- --measure`.
Idempotent (proven: identical state hash across two consecutive runs, with
stable ids, because test cases upsert by ordinal rather than wipe-and-recreate).
`--measure` runs every reference solution against every test case on the real
judge, which both proves correctness and produces `referenceRuntimeMs`:

```
2382 reference solutions run across 86 problems  ->  86/86 active
```

`data/LICENSE` is written, `data/NOTICE` is **generated** from the provenance
columns, and the root README states the code/data split.

---

## Verified reachable, not just imported

"Imported as ACTIVE" and "reachable in the app" are different claims, and the
first does not imply the second. Against the running API, on freshly built code:

```
60 draws from GET /v1/problems/next  ->  12 distinct problems, all Tier 0
(run when the corpus was 12; the gate serves Tier 0 first by design)
```

The three legacy rows are correctly excluded (not `eligibleForUnlock`), and the
payload carries no editorial, reference solution or pattern name.

Two things to know when checking this yourself:

- **The API runs `dist/index.js`.** A source change is invisible until
  `npm run build -w @codelock/api`. An end-to-end check against a stale build
  tests the previous release — which is exactly how the eligibility filter
  appeared broken when it was not.
- `npm run import:corpus` **without** `--measure` is safe and keeps rows active;
  it carries the stored runtimes forward.

## Three bugs found by doing this

**The 125 MB memory limit made C++ and Go unsolvable.** `Problem.memoryLimitKb`
defaulted to 128000, the sandbox applies it as the container's `--memory`, and
**the compiler runs inside it**. A two-line "read two ints, add them" program
failed to compile in both languages — Go's stderr said the compiler was killed.
Two of six languages could not solve *anything*. Measured: 256 MB still fails,
500 MB passes. Default raised to 512000 and existing rows lifted (migration
`raise_memory_limit_for_compilers`). **Re-measure if the judge images change.**

**A re-import without `--measure` deactivated the entire corpus.** The importer
correctly carried stored `referenceRuntimeMs` forward onto the row, but computed
its "is anything missing?" check from *this run's* measurements instead of the
effective ones. So a plain `npm run import:corpus` — a routine command — marked
every already-measured, already-live problem INACTIVE. The app served nothing
but the three legacy rows, while the importer's own report said 12 active.

It also invalidated the first idempotency check: both snapshots were taken after
the deactivating run, so two identically-broken states matched. The check now
takes its baseline before the first run. Fixed, with a regression test.

**There were no HARD problems, and difficulty was never relaxed.** The ladder
promotes a user to HARD after three fast solves; `pickProblem` filtered to HARD,
found nothing, and threw, so the lock could not engage at all. The fallbacks
relaxed cooldown and tier but never difficulty — meaning the product broke
precisely for the users who got good at it. There is now a final fallback to the
whole active pool, and `problemSelector.fallback.test.ts` pins the order.

**Java single-file source mode runs the first class in the file.** With
`TreeNode` on top, `java Main.java` looked for `main` in TreeNode and refused.
`public class Main` now comes first, node types beneath. Found by the sandbox,
not by review — which is the argument for `verify:drivers` existing at all.

Also worth knowing: the first `verify:drivers` run reported 0/18 when nothing
was wrong. The judge returns Judge0's `status` **object** (`{id, description}`),
not a bare number, so the poll treated every submission as finished instantly.
That is why there is now one shared `judge-client.ts` rather than two polling
loops.

---

## Authoring at scale — what the pipeline taught us

Batches are authored in parallel (`src/corpus/problems/tier*.ts`, aggregated by
`problems/index.ts`) against the contract in `docs/AUTHORING.md`, then gated by
`import:corpus --measure`. Codex authored 49 of the Tier 0.5 problems this way.

**The gate works, including on its authors.** Of the first 49 Codex problems, 8
failed the judge and were correctly held INACTIVE. Every one was a real defect,
and the failure signature told us which kind:

- **All six languages agree on an answer the test did not expect** → the *test*
  is wrong. Six independent implementations do not share a bug. Four op-log
  cases had one fewer expected line than the declared operation count — a void
  method whose `null` was forgotten.
- **One language fails deterministically, the other five pass** → that
  language's solution, or the driver for it, is wrong.
- **A language fails intermittently, on problems that passed before** →
  infrastructure. `runBatch` now retries those automatically.

**The `union` keyword bug.** `cls:union-find` originally named a method
`union`, which is a reserved word in C++, so the generated driver emitted
`__obj->union(...)` and could not compile. It is now `unite`. The general rule:
a method name in a class signature must be spellable in all six languages.

**The judge hides C++ compile errors.** Its C++ command is
`g++ ... 2>/tmp/cc.log && ./a.out`, so compiler diagnostics go to a file nobody
reads and a compile failure arrives as a "runtime error" with empty output and
empty stderr. That cost real time on the `union` bug. Worth fixing in
`apps/judge/src/languages.ts` — surface `cc.log` as `compile_output`.

**Scaling limits found:** the judge caps a request body at 2 MB (~300
submissions), so `runBatch` chunks at 80. Throughput is roughly 25 runs/minute
at concurrency 4, so the full ~695-problem corpus is ~20,000 runs and on the
order of 13 hours of judge time per full re-measure. Incremental measurement —
re-measuring only changed problems — is the obvious next improvement.

## What remains

**The corpus, which is the bulk of the work.**

| Tier | Target | Authored | Notes |
|---|---|---|---|
| 0 Foundations | ~60 | **28** | loops, strings, arrays, hashmaps, parsing |
| 0.5 Implement the DS | ~55 | **49** | linear, hashing/caches, trees/tries, heaps/graphs |
| 1 Core patterns | ~150 | **9** | Arrays & Hashing family complete |
| 2 Variations | ~330 | 0 | 3 per Tier 1 problem |
| 3 Breadth | ~100 | 0 | |

The 12 authored problems are CC0, written from scratch, each with six reference
solutions, an editorial written for someone who did *not* get it, and 4–6 test
cases. `src/corpus/problems/tier0.ts` documents the house style; follow it.

**Tier 0.5 is the next thing to author**, not more Tier 0. Its driver is already
green in six languages, the 15 class signatures exist with their method
contracts, and until some Tier 0.5 problems exist no user can ever reach Tier 1
— the gate requires at least one structure built.

**Smaller items owed:**

- `ecc:database-reviewer` has **not** reviewed the migrations or the importer
  write pattern. The brief asked for it; I did not spawn subagents.
- The tier gate is unit-proven and wired into `claimDueSession`, but there is no
  end-to-end test asserting that a real new user's first five *served* problems
  are Tier 0. The logic test and the wiring both exist; the seam between them is
  untested.
- **Three problems from the original `seed.ts` have no editorial and no
  reference solution.** They are ACTIVE, so a fallback can serve them, and a
  user who fails one gets an empty debrief — the exact outcome the debrief
  exists to prevent. They also predate the taxonomy, so `eligibleForUnlock` is
  false and normal selection skips them. They escaped the completeness rule only
  because they never went through the importer. Re-author them as definitions
  (two-sum, valid-parentheses and longest-unique-substring are all Tier 1
  canonical, so this doubles as the start of Tier 1) — do not simply deactivate
  them, as `longest-unique-substring` is currently the only MEDIUM problem.
- `prisma/seed.ts` and the importer are now two ingestion paths. The importer is
  the one to keep.
- MBPP's 427 sanitized rows are the cheapest real corpus win available and are
  licence-cleared. They need reshaping to signatures — the assertions are
  Python-only and must be reduced to input/output pairs.

---

## Things not to rediscover

- **Never ingest LeetCode statement text**, including from permissively licensed
  mirror repositories. A LICENSE file on someone's solutions repo covers their
  code, not LeetCode's statements. The canonical *lists* are facts and are free.
- **A source with no stated licence is excluded**, not assumed permissive.
- **Author by signature, never by problem.** If a new problem does not fit an
  existing signature, prefer reshaping the problem. A new signature costs six
  language implementations plus a cross-language test round.
- **Re-run `verify:drivers` after any judge, image or language-version change**,
  and re-run `import:corpus --measure` after any of those too — an uncalibrated
  speed gate is not a slightly wrong number, it is a lockout.
