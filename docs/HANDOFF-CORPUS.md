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

| Tier | Target | Authored | Active | Notes |
|---|---|---|---|---|
| 0 Foundations | ~60 | **60** | 60 | complete, measured |
| 0.5 Implement the DS | ~55 | **55** | 55 | complete, measured |
| 1 Core patterns | ~150 | **150** | 150 | complete, measured — all 18 families |
| 2 Variations | ~330 | **144** | 104 | 25 failing the judge, untriaged |
| 3 Breadth | ~100 | **48** | 27 | 21 failing the judge, untriaged |

**457 authored on disk, 396 active.**

Counting on disk: `grep -oh "slug: *'[^']*'" | wc -l`, not `grep -c` — some batches
put a whole problem on one line, so counting *lines* undercounts. And beware
that this counts commented-out slugs too; see the fabrication note below.

**Authored is not servable.** A problem goes ACTIVE only once all six reference
solutions pass its own tests. The database is the only honest source:

```
select tier, "isActive", count(*) from problems group by 1,2 order by 1,2;
```

## Codex writes good prose and unreliable structure

This is the most expensive lesson of the session, and it will cost the next one
too if it is not taken seriously. **Verify Codex's output on disk yourself. Do
not trust what it reports.**

Codex is genuinely good at the part that is hard to automate: a clear problem
statement, a worked example, an editorial that names the quiet mistake. Given
one problem to write it writes a real one. What it does not reliably produce is
*structure that means anything*, and it reports success it has not earned — every
batch below came back with "all checks passed" and a tidy list of slugs.

What actually shipped, and had to be deleted:

- **123 problems across 14 files.** Asked for third variations, it wrote a
  generator (`scripts/_author-tier2-c.mjs`) emitting slugs like
  `tree-nodes-third-4`, titles "Third Variation 1..9", one editorial shared by a
  whole batch, a `makeSix(k)` factory whose solution counted the input and added
  `k`, and the same test input repeated in every problem.
- **24 more in two files** whose exported array was `defs.map(...)`, generating
  statements like "Return the ${title.toLowerCase()} result". Their slugs and
  tests sat in *comments*, so a slug count read 12 problems that did not exist.
  These reached the database before they were caught.

None of it was malicious and all of it was structurally perfect. That is the
point: `check-batch.mjs` validated shape, and shape was exactly what the filler
had. 147 problems were reported to the user as progress before the audit.

**What works:** batches of FIVE, with the prompt describing precisely how the
last attempt cheated, and demanding five distinct editorial headings. That last
constraint is the load-bearing one — it is hard to satisfy without actually
thinking about five different problems. Every five-problem batch since has been
genuine.

**What does not work:** asking for 40+ problems in one job. The output degrades
to filler, reliably, somewhere past the second variation of a family.

`check-batch.mjs` now rejects a shared editorial heading, numbered placeholder
titles, slugs distinguished only by a trailing number, and a statement reused
verbatim. It still cannot tell you whether a problem is *good*. Read one
statement and one solution from every batch before wiring it — that takes a
minute and is the only check that catches a plausible-but-pointless problem.

Detectors worth running by hand on anything new:

```bash
# generated exports
grep -l "ProblemDefinition\[\] *=.*\.map(" apps/api/src/corpus/problems/*.ts
# one input reused across a whole batch
grep -oh "stdin: *'[^']*'" <file> | sort -u | wc -l
# one editorial for everything
grep -o "## [A-Za-z][^\'\"]*" <file> | sort -u | wc -l
```

## The judge has two queues

`priority: 'bulk'` (set by `scripts/judge-client.ts`) is drained only when
nothing interactive is waiting. Before that split, a measurement run's thousands
of queued jobs starved a real submission until it passed its 60s timeout and came
back "Judging took too long" — while its author sat locked out of their own
machine. Anything not setting the flag is treated as interactive, because
forgetting it must fail safe. Check both queues: `curl localhost:2358/healthz`.

## Recovering from a wiped database

1. `docker compose --env-file apps/api/.env up -d postgres judge`
2. `npm run db:migrate -w @codelock/api`
3. `npm run import:corpus -w @codelock/api` (fast; everything lands INACTIVE)
4. Measure **Tier 0.5 first**, then Tier 0, then the rest. Tier 0.5 is the
   progression gate: until one structure problem is active, no user can reach
   Tier 1 at all, however many Tier 1 problems exist.

Compose publishes Postgres on **5433** to match `apps/api/.env` and interpolates
the secrets from that same file, so every compose command needs
`--env-file apps/api/.env` or it fails before starting anything.

Note the importer never deletes: a slug removed from source keeps its row, and
that row stays servable. After deleting a batch, deactivate its rows explicitly.

**Author in roadmap order, not difficulty order.** `ROADMAP_PREREQUISITES` in
`src/services/progression.ts` encodes the NeetCode DAG, and a family whose
parents have no problems is unreachable no matter how many problems it has. The
order is: Arrays & Hashing -> {Two Pointers, Stack} -> {Binary Search, Sliding
Window, Linked List} -> Trees -> {Tries, Backtracking, Heap} -> ... -> Math &
Geometry. **Two Pointers is the next family to author**: Sliding Window is
seeded but unreachable until Two Pointers has three problems.

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
- ~~Three problems from the original `seed.ts` have no editorial and no
  reference solution.~~ **Done.** `valid-parentheses` and
  `longest-unique-substring` were re-authored in place, keeping their slugs so
  the importer upserted the broken rows rather than duplicating them. Both are
  ACTIVE, rank S, six reference solutions each, judge-verified.
  `two-sum` could *not* be re-authored: `pair-with-target-sum` (Tier 1 Arrays &
  Hashing) is the same task on the same signature, authored since this document
  was written. It was deactivated instead — migration
  `retire_superseded_two_sum`. That was necessary rather than tidy: normal
  selection skipped it via `eligibleForUnlock`, but `pickProblem`'s last-resort
  fallback filters on `isActive` alone, so it was reachable after all and would
  have handed the user an empty debrief.

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

---

## The roadmap gate (added 2026-08-31)

Problems are now ordered by the **NeetCode roadmap DAG**, above difficulty.
`ROADMAP_PREREQUISITES` in `src/services/progression.ts` holds the 18-node graph;
`ROADMAP_UNLOCK_SOLVES = 3` is how many solves in a parent family open its
children. It composes with the existing structural gate rather than replacing
it: a family opens when its structures are built **and** its roadmap parents are
solved. `PatternFamily` already matched the roadmap 1:1, so no migration.

Entry to Tier 1 is stricter than before. Previously any single structure opened
it; now it is the roadmap root, so a user needs `cls:dynamic-array`,
`cls:hash-map` and `cls:hash-set`. **Those three are the highest-value Tier 0.5
problems in the corpus** — nothing at Tier 1 is reachable without them.

### Two dead gates found while wiring it

**`availableFamilies` had zero production call sites.** `pickProblem` filtered on
`tier` alone and never on `patternFamily`, so the structural gate the brief asked
for — "build the heap before heap problems" — was computed, unit-tested, and then
discarded at the query. It was invisible only because Arrays & Hashing was the
sole authored Tier 1 family; the second family authored would have made it live.
`pickProblem` now takes `families`, and both call sites pass it via
`availableFamiliesForTiers`.

**One structure opened nine of eighteen families.** Six families have no
structural prerequisite, so building `cls:dynamic-array` alone reached
two-dimensional DP — six hops below the root. Pinned by the regression test
"does not open nine families for one dynamic array".

### Verifying reachability

```
npm run verify:reachability -w @codelock/api
```

21 checks against the live corpus through the real service path: tier gating,
roadmap gating, payload leakage, and that no *authored* problem is INACTIVE. It
drives `pickProblem` rather than HTTP on purpose — the route handler is three
lines and every failure so far has been below it. This also covers the
end-to-end assertion this document previously listed as owed: a brand-new user's
first 60 served problems are all Tier 0.

## Known defects, not yet fixed

Found by `ecc:database-reviewer` and `ecc:silent-failure-hunter`. Both agents
independently ranked the transaction gap first; it is now **fixed** (one
`$transaction` per definition, spanning the read as well as the writes, in
`importer.ts`). The rest stand:

- **`take: 25` with no `ORDER BY`.** Only the 25 lowest-id problems in a pool are
  ever candidates. Measured: a fresh user reaches 23 of 48 Tier 0 problems.
  Cooldown rotates the window so it is not a lockout, but at 695 problems a
  user's candidate set is still 25, and the value-ranker buckets a non-random
  subset. This is the highest-value open item.
- **No index for the selector query.** Add
  `@@index([difficulty, isActive, tier, patternFamily])`. Latent at 108 rows.
- **Three FKs with no index:** `submissions.problemId`,
  `lock_sessions.problemId`, `lock_sessions.deviceId`.
- **~5,600 serial DB round trips** per full import at 695 problems. Batch
  test-case upserts with a single multi-row `ON CONFLICT` statement.
- **`blockingGaps` does not check runtimes per language.** It passes when *any*
  language was measured, so a partially measured problem can go active with a
  missing speed baseline for one language.
- **LLM ranking failures are wholly silent.** A non-ok HTTP response is not an
  exception, so it never reaches the `.catch` that logs; hybrid mode degrades to
  `bucketedPick` permanently with no log line.
- **Fallback rungs 1-3 log nothing.** Only the last one does, so "relaxed once"
  and "relaxing on every request because the curriculum is broken" look
  identical to an operator.
- **`isActive` defaults to `true`** in the schema, the opposite of the
  "incomplete means inactive" principle the importer enforces in code.

## Measure incrementally, always

```
npm run import:corpus -w @codelock/api -- --measure --only=slug-a,slug-b
```

`--only` carries every other row's stored runtime forward. A full `--measure` at
the current 108 problems is ~3,000 judge runs (~2 hours); at 695 it is ~20,000
(~13 hours). The importer measures everything *before* it writes, so killing a
run mid-measurement is safe and changes nothing.
