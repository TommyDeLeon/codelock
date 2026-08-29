# Hand-off — the corpus project

Read cold. This covers the seven-phase corpus and value-ranker work that
`HANDOFF-2026-08-30.md` listed as "not started". All of it is committed:
`corpus`, `schema`, `ranker`, `selection`, `progression`, `importer`, `memory`.

```
npm test           1085 passing / 30 files   (api 999 · desktop 67 · judge 15 · web 4)
npm run typecheck  clean across the workspace
```

---

## The short version

The **machinery** is built, tested and wired end to end. The **corpus is not**:
12 problems are authored and active against a target of ~695. That gap is the
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
378 reference solutions run  ->  all passed  ->  12/12 active
```

`data/LICENSE` is written, `data/NOTICE` is **generated** from the provenance
columns, and the root README states the code/data split.

---

## Two bugs found by doing this

**The 125 MB memory limit made C++ and Go unsolvable.** `Problem.memoryLimitKb`
defaulted to 128000, the sandbox applies it as the container's `--memory`, and
**the compiler runs inside it**. A two-line "read two ints, add them" program
failed to compile in both languages — Go's stderr said the compiler was killed.
Two of six languages could not solve *anything*. Measured: 256 MB still fails,
500 MB passes. Default raised to 512000 and existing rows lifted (migration
`raise_memory_limit_for_compilers`). **Re-measure if the judge images change.**

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

## What remains

**The corpus, which is the bulk of the work.**

| Tier | Target | Authored | Notes |
|---|---|---|---|
| 0 Foundations | ~60 | **12** | loops, strings, arrays, hashmaps, parsing |
| 0.5 Implement the DS | ~55 | 0 | driver is proven; 15 class signatures ready |
| 1 Core patterns | ~150 | 0 | one per pattern, NeetCode 150 shape |
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
- Three problems from the original `seed.ts` predate all of this. They carry
  default provenance (accurate — the project authored them) but no tier or
  ranking, so `eligibleForUnlock` is false and selection reaches them only
  through the fallback. Either re-author them as definitions or retire them.
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
