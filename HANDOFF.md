# Hand-off — corpus, and using the app today

Read cold. Two audiences: you, wanting to learn Python with this tonight, and
whoever picks up the corpus work next.

Everything below is committed on `main`. Deeper detail lives in
[`docs/HANDOFF-CORPUS.md`](docs/HANDOFF-CORPUS.md);
[`docs/AUTHORING.md`](docs/AUTHORING.md) is the contract for adding problems.

---

## You can use it now

**685 problems are live, out of 695 authored.** Every live one has a starter, a
reference solution in all six languages, an editorial, and 4–6 test cases that
were actually run in the sandbox.

```
npm test        1021 passing (api) · 62 passing (desktop) · typecheck clean
verification    every active problem passed the judge against its own
                reference solution, in all six languages
```

| Tier | Live | What it is |
|---|---|---|
| 0 Foundations | 60 | loops, strings, lists, dicts, parsing — the whole tier |
| 0.5 Build the structure | 55 | stack, queue, deque, linked list, hash map/set, LRU/LFU, BST, trie, heap, priority queue, union-find, graph |
| 1 Core patterns | 150 | every pattern family, complete |
| 2 Variations | 325 | a twist on each Tier 1 pattern — a cap, a cooldown, a tie rule |
| 3 Breadth | 95 | grids, matrices, strings, sorting, number theory, prefix sums |

The 10 authored but not live failed the judge against their own reference
solution and are therefore never served. That is the gate working as designed:
it is not possible to ship a broken problem, only a missing one.

Verified end to end against the running API on 2026-08-30: a brand-new account
is served **Tier 0 only**, every problem carrying a Python starter. The
progression gate opens Tier 0.5 after 5 Tier 0 solves, and opens Tier 1 per
pattern family once the structure that family depends on has been built.

### It fits the `learn` roadmap

`D:/Cowork/learn` is a 36-week Python track for a complete beginner. The tiers
line up with it directly, and several of its "build this" exercises already
exist here as judged problems:

| `learn` stage | CodeLock tier | Overlap that already exists |
|---|---|---|
| Weeks 1–3, core syntax | Tier 0 | `fizzbuzz-list`, `count-vowels`, `is-prime`, `sum-of-digits` |
| Weeks 4–6, functions and data | Tier 0 | `largest-number` (write `find_max` yourself), `remove-duplicates-in-order`, `most-frequent-character` |
| Weeks 13+, data structures | Tier 0.5 | every structure in the DSA half, built rather than imported |

**Not yet done:** nothing tags a problem with its roadmap stage. Adding a
`roadmapStage` field to `ProblemDefinition` and filtering on it would let the
app serve exactly the week you are on. That is the highest-value feature for
your use case and a small change — the data is already aligned.

### Running it

Opening the desktop app starts everything. By hand:

```bash
npm run start -w @codelock/api
```

The API serves `dist/`, so **a source change is invisible until
`npm run build -w @codelock/api`**. That caught me out once: a filter looked
broken when it was a stale build.

---

## The corpus: 695 authored, 685 live

| Tier | Target | Authored | Live |
|---|---|---|---|
| 0 Foundations | ~60 | **60** | 60 |
| 0.5 Implement the DS | ~55 | **55** | 55 |
| 1 Core patterns | ~150 | **150** | 150 |
| 2 Variations | ~330 | **330** | 325 |
| 3 Breadth | ~100 | **100** | 95 |

The target is met. What remains is not authoring but repair: ten problems whose
reference solution disagrees with their own tests, listed by re-running the
measurement and reading the failure lines.

### The failure mode that cost the most, twice

**A generated batch is structurally perfect and completely fake.** Codex has
three times produced a batch where every problem shared one program:

  - `six(tag)` returning one traversal for twelve problems, distinguished only
    by a `/* ${tag} */` comment;
  - `six(kind)` as a dispatcher that returned `0` for every branch it never
    implemented;
  - `six = (j, t = '', py = '', ...)` — six parameters so it passed the arity
    check, five defaulting to empty string, then called with one argument, so
    eleven problems shipped JavaScript and five empty programs.

All three passed `check-batch.mjs` at the time. Each is now caught: the checker
counts the arguments actually passed at every call site and rejects empty-string
defaults. `scripts/check-semantics.mjs` catches the rest by comparing content
across the whole corpus — duplicate solutions, duplicate statements, colliding
slugs. Run both before believing a batch.

**Codex authors new files well and cannot rewrite an existing one.** Roughly
fifteen new-file batches came back clean first time. Four attempts to rewrite
two existing files all failed — renaming the dispatcher, truncating at 4 of 12,
at 5 of 12, and leaving an undefined helper. When a batch needs replacing, add a
new file instead of asking for an edit in place.

**The handoff's own diagnostic rule has an exception.** "All six languages agree
on an answer the test did not expect → the test is wrong" holds only when the
six were written independently. A generated batch is one algorithm translated
six times, so the six share bugs and can agree on a wrong answer. Re-derive from
the statement instead of trusting the agreement.

### How to add the rest

One file per batch in `src/corpus/problems/`, aggregated by `index.ts`. Then:

```bash
npm run import:corpus -w @codelock/api -- --measure
```

```bash
npm run import:corpus -w @codelock/api -- --measure --only=slug-a,slug-b
```

`--only` matters: a full re-measure is hours, one problem is seconds.

**A problem that fails its own reference solution imports as INACTIVE and is
never served.** It is not possible to ship a broken problem, only a missing one.
29 structural tests run over the whole aggregate first (six languages, editorial
length, class signatures, cross-batch slug uniqueness), so most defects never
reach the judge.

### Reading a failure

The signature tells you which kind it is, and this is the most useful paragraph
in this document:

- **All six languages agree on an answer the test did not expect** → the *test*
  is wrong. Six independent implementations do not share a bug.
- **One language fails deterministically, five pass** → that language's
  solution, or the driver for it.
- **A language fails intermittently, on problems that passed before** →
  infrastructure. `runBatch` retries those automatically now.

### Throughput

About 23 judge runs a minute at `JUDGE_CONCURRENCY=8`, which is roughly 26 runs
per problem. Concurrency is now 8 and that is the ceiling on this box: each
sandbox container pegs a core, and at 8 plus other work the host killed 82 runs
outright and had to retry them.

**Why setting concurrency "did not take" before:** `docker compose` aborts
before it starts anything, because the file interpolates four API secrets that
live only in `apps/api/.env`, and there is no root `.env`. The error names the
missing variables, not the concurrency change, so the setting looks ignored.
Use `docker compose --env-file apps/api/.env up -d judge`.

**Past ~120 slugs, `--only=` exceeds the Windows 8191-character command line**
and dies with a bare `The syntax of the command is incorrect`. Worse, one slug
that no longer exists aborts the whole run before a single problem is judged —
that silently cost 65 problems in one batch here. Use `--only-file=` with one
slug per line, and regenerate the list from current source each time.

---

## Bugs found and fixed, worth not rediscovering

- **The 125 MB memory limit made C++ and Go unsolvable.** The sandbox applies
  `Problem.memoryLimitKb` as the container's `--memory`, and the *compiler* runs
  inside it. A two-line program failed to compile in both. Default is now
  512000. Re-measure if the judge images change.
- **A re-import without `--measure` deactivated the entire corpus.** The
  completeness check read that run's measurements instead of the effective ones.
  Fixed, with a regression test.
- **No HARD problems existed and difficulty was never relaxed**, so a user
  promoted to HARD could not engage a lock at all. There is now a final fallback
  to the whole active pool.
- **`union` is a reserved word in C++.** The union-find method is `unite`. A
  class-signature method name must be spellable in all six languages.
- **The judge hides C++ compile errors** — `g++ ... 2>/tmp/cc.log && ./a.out`
  means diagnostics vanish and a compile failure looks like an empty runtime
  error. Worth fixing in `apps/judge/src/languages.ts`.
- **Java single-file mode runs the first class in the file**, so `public class
  Main` must come first.

## Owed

- Tag problems with `learn` roadmap stages (see above — highest value for you).
- **Ten problems fail their own tests** and are held inactive. Re-run the
  measurement to list them; each needs its answer re-derived from the statement.
- **Two web tests fail** (`use-lock-session.render.test.tsx`). Not a countdown
  bug: the spec's `beforeEach` is empty while its comment still explains why
  setup is required, and git history shows a `useAuth.setState(...)` line was
  deleted from it when accounts were removed. Restore an equivalent setup or
  delete the spec — it cannot pass as written now that there is no auth.
- **Degenerate problems in `tier2-intervals.ts`.** `echo-sorted-shared-blocks`
  says the blocks are "already disjoint and sorted", so `return a` is genuinely
  correct; `cancel-one-overlapping-chain` answers `max(0, n - 1)` regardless of
  the intervals. They pass the judge honestly and teach nothing. No tool can
  catch this — the statement defines away the pattern it claims to drill.
- `prisma/seed.ts` and the importer are two ingestion paths. Keep the importer.
- `ecc:database-reviewer` has not reviewed the migrations.
- No end-to-end test asserts a real new user's first five *served* problems are
  Tier 0. Checked by hand on 2 Sep 2026 — five for five — but the seam between
  the logic and the wiring is still untested.

## Fixed here, worth not reintroducing

- **An unlock token opened any lock, not the one it was earned for.** The
  signature was verified; the `sid` claim was never compared to the held
  session, so a token kept from an earlier problem opened a later lock inside
  its five-minute life. One solve bought every lock in that window, and the
  replay was indistinguishable from an earned unlock. Now `unlockTokenOpensLock`
  in `apps/desktop/src/lock-state.ts`, with regression tests. Escape matrix D23.
- **A problem deleted from the corpus was never deactivated.** Nothing revisits
  a row whose definition is gone, so it kept its measurements and stayed
  servable — which is how a placeholder titled `Pending`, prompt `x`, solution
  `return 0`, was still reachable long after its slug was removed. The importer
  now deactivates rows absent from the authored corpus, guarded so an empty
  definitions list cannot deactivate everything.
