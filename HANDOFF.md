# Hand-off — corpus, and using the app today

Read cold. Two audiences: you, wanting to learn Python with this tonight, and
whoever picks up the corpus work next.

Everything below is committed on `main`. Deeper detail lives in
[`docs/HANDOFF-CORPUS.md`](docs/HANDOFF-CORPUS.md);
[`docs/AUTHORING.md`](docs/AUTHORING.md) is the contract for adding problems.

---

## You can use it now

**109 problems are live, and all 109 are judge-verified.** Every one has a
Python starter, a Python reference solution, an editorial, and 4–6 test cases
that were actually run in the sandbox.

```
npm test        1010 passing (api) · typecheck clean
verification    every active problem passed the judge against its own
                reference solution, in all six languages
```

| Tier | Live | What it is |
|---|---|---|
| 0 Foundations | 48 | loops, strings, lists, dicts, parsing — the whole tier |
| 0.5 Build the structure | 49 | stack, queue, deque, linked list, hash map/set, LRU/LFU, BST, trie, heap, priority queue, union-find, graph |
| 1 Core patterns | 12 | Arrays & Hashing complete, plus 3 legacy rows |

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

## The corpus: 106 authored of ~695

| Tier | Target | Authored | Remaining |
|---|---|---|---|
| 0 Foundations | ~60 | **48** | 12 |
| 0.5 Implement the DS | ~55 | **49** | 6 (Tier 3 optional: segment tree, Fenwick, AVL) |
| 1 Core patterns | ~150 | **9** | 141 |
| 2 Variations | ~330 | 0 | 330 |
| 3 Breadth | ~100 | 0 | 100 |

Tier 0 and Tier 0.5 — the part a beginner actually needs — are essentially
complete. What remains is mostly Tier 1 and its variations.

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

About 25 judge runs a minute at `JUDGE_CONCURRENCY=4`. The remaining ~590
problems are roughly 16,000 runs — some 11 hours of judge time, plus authoring.
The box has 12 CPUs and 28 GB, so concurrency 8 should roughly halve that; my
attempt to set it did not take and the judge is still running at 4.

**Codex is out of quota until 27 Sep 2026.** It authored 49 of the Tier 0.5
problems before running out and was by far the fastest lever. Restoring that
quota is the main thing that would speed this up.

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
- The 3 legacy `seed.ts` problems have no editorial and no reference solution, so
  a user who fails one gets an empty debrief. Re-author them as definitions; do
  not simply deactivate, as one is the only MEDIUM row.
- `prisma/seed.ts` and the importer are two ingestion paths. Keep the importer.
- `ecc:database-reviewer` has not reviewed the migrations.
- No end-to-end test asserts a real new user's first five *served* problems are
  Tier 0 — the logic and the wiring are each tested; the seam between them is not.
