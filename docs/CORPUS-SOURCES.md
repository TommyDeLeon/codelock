# Corpus sources — licensing and list research

Phase 1 of the corpus project. Two questions, kept apart on purpose:

1. **Statements.** May we redistribute the problem text? This is a copyright
   question and getting it wrong has legal consequences.
2. **Lists.** Which patterns, in what order, at what difficulty? This is a
   question of fact. Facts are not copyrightable. The canonical interview lists
   are usable as *taxonomy* regardless of the licence on the page that prints
   them.

Every licence below was read from the canonical URL given. Where a claim could
not be confirmed from a primary source it is marked **unverified** rather than
guessed — a wrong guess here is not a bug, it is an infringement.

Verified: 2026-08-30.

---

## Summary table

| Source | Statement licence | Redistribute statements? | Test cases | NC | SA | Verdict |
|---|---|---|---|---|---|---|
| LeetCode | Proprietary | **No** | No | — | — | **Excluded** |
| DeepMind CodeContests | CC BY 4.0 (non-code) | **Yes, with attribution** | Yes | No | No | **Cleared — free tier** |
| MBPP | CC BY 4.0 | **Yes, with attribution** | Yes (3/problem) | No | No | **Cleared — free tier** |
| HumanEval | MIT | **Yes, with attribution** | Yes | No | No | **Cleared — free tier** |
| APPS | MIT (repo badge) | **Unverified — see below** | Unverified | — | — | **Blocked pending review** |
| Project Euler | CC BY-NC-SA 4.0 | Yes, `data/` only | No | **Yes** | **Yes** | **Cleared — `data/` tier** |
| USACO Guide | CC BY-NC-SA 4.0 | N/A — taxonomy only | N/A | **Yes** | **Yes** | **Taxonomy only** |
| freeCodeCamp curriculum | CC BY-SA 4.0 | Yes, `data/` only | N/A | No | **Yes** | **Syllabus source** |
| Rosetta Code | GFDL 1.2 (no "or later") | Technically yes, **do not** | No | No | **Yes** | **Excluded — practical** |
| CSES | No licence stated | **No** | No | — | — | **Excluded — silence is not permission** |
| Exercism | Unverified | Unverified | Unverified | — | — | **Unverified** |

"Free tier" = may live in the normal code/asset tree. "`data/` tier" = NC or SA,
so it lives under `data/` with its own LICENSE and NOTICE and never in the code
tree (see *The code/data split* below).

---

## Cleared for the free tier

### DeepMind CodeContests
- Canonical: <https://github.com/google-deepmind/code_contests>
- Code: **Apache 2.0.** Non-code materials: "All non-code materials provided are
  made available under the terms of the CC BY 4.0 license."
- **Includes test cases** — paired inputs and outputs, plus correct and
  incorrect human solutions in several languages. This is the single most
  valuable property of this source: test data is the expensive part of authoring.
- Upstream provenance is mixed and each strand carries its own attribution:
  Codeforces (sourced from codeforces.com), Description2Code (MIT), CodeNet /
  Aizu / AtCoder (Apache 2.0), plus CodeChef and HackerEarth reached through
  Description2Code.
- **Consequence for us:** attribution must be *per problem*, naming the upstream
  strand, not a single blanket credit line. `sourceRef` therefore has to record
  which strand a row came from. This is why the Phase 3 schema makes
  `sourceRef` non-null.
- Caveat, stated plainly: DeepMind's CC BY 4.0 grant covers the collection as
  they publish it. It does not retroactively relicense Codeforces' own
  statements, and Codeforces' terms are separate. We rely on the redistributor's
  grant, which is the normal and accepted posture for this dataset, but it is a
  *reliance*, not an independent audit of every upstream row.

### MBPP (Mostly Basic Python Problems)
- Canonical: <https://huggingface.co/datasets/google-research-datasets/mbpp>
- **CC BY 4.0.** 974 rows; the hand-verified "sanitized" subset is 427.
- Fields: `text` (statement), `code` (reference solution), `test_list` (~3
  assertions), plus setup/imports and an optional `challenge_test_list`.
- **Best fit for Tier 0.** "Mostly basic" is literally the design brief, and our
  audience is people who cannot yet write a for-loop confidently. The 427
  sanitized rows are worth more than the other 547 combined: the unsanitized
  descriptions are frequently under-specified, which for a beginner under a lock
  screen is indistinguishable from the problem being unfair.
- Python-only assertions. Our judge is six languages, so `test_list` must be
  *reduced to input/output pairs* and re-expressed through a Phase 2 signature —
  it cannot be used as-is.

### HumanEval
- Canonical: <https://github.com/openai/human-eval>
- **MIT.** Includes docstring statements, tests, canonical solutions. 164
  problems (count from the accompanying paper; the repo landing page does not
  state it).
- Small, and the statements are docstrings written for a model, not prose
  written for a learner. Useful as a *test-case* source and as Tier 0 filler
  after rewriting. Not a headline source.

---

## Cleared, but `data/` tier only

### Project Euler
- Canonical: <https://projecteuler.net/copyright>
- **CC BY-NC-SA 4.0.** Explicitly: problems "must not be used for commercial
  purposes", and any derivative work is subject to the same licence.
- Required attribution wording is given by the site itself: *"The following
  problem is taken from Project Euler"* verbatim, or *"The following problem was
  inspired by problem {id} at Project Euler"* if modified. Use their wording; do
  not paraphrase it.
- **These problems must score high on `answerLookupRisk`.** A Project Euler
  answer is a single integer, published, and searchable. That is exactly the
  Phase 4 case: the ranker must drop them out of the unlock pool through the
  score, not through a hardcoded `if source === 'euler'`.

### freeCodeCamp curriculum
- Canonical: <https://github.com/freeCodeCamp/freeCodeCamp>
- Split licence: software **BSD-3-Clause**; everything under `/curriculum`
  **CC BY-SA 4.0**. Share-alike, but *not* non-commercial.
- Used here primarily as the **data-structure syllabus** for Tier 0.5 — the
  ordering of "build the structure before you use it" — which is taxonomy and
  free regardless. If any curriculum prose is redistributed, it goes to `data/`.

---

## Taxonomy only

### USACO Guide
- Canonical: <https://github.com/cpinitiative/usaco-guide>, content
  **CC BY-NC-SA 4.0**.
- Per the project brief, `usaco.guide/problems` is an **index of
  externally-hosted problems**, not a statement host. Its value to us is the
  difficulty ladder and the module ordering — a taxonomy, and a good one,
  because it is explicitly built as a progression rather than a checklist.
- Do not copy module prose. Do not copy their problem tables verbatim either: a
  curated table can attract thin-compilation protection in some jurisdictions
  even where the individual facts do not. Extract the ordering, re-express it.

---

## Excluded

### LeetCode — hard exclusion
- No public API and no write path. Statements are proprietary.
- **An MIT licence on a "leetcode solutions" repository covers that author's
  code. It does not cover LeetCode's statement text.** Repositories that ship
  the statement alongside the solution are redistributing something the uploader
  had no right to relicense. Their permissive LICENSE file does not launder it,
  and an importer that reads such a repo is not safer than one that scrapes the
  site directly.
- The canonical **lists** — Blind 75, NeetCode 150, Grind 75 — are facts about
  which patterns matter, and are used freely below.
- `leetcodeSlug` on `Problem` is a *pointer*, not content, and stays.

### CSES
- <https://cses.fi/problemset/> carries **no licence or terms-of-use statement**
  that could be found on the problem set page.
- Silence is not permission; the default is all rights reserved. Excluded until
  a permission request is answered (draft below). The problem set is authored by
  Antti Laaksonen, whose *Competitive Programmer's Handbook* is distributed
  freely — which makes an educational-use request plausible, but plausible is
  not a licence.

### Rosetta Code
- Content is **GFDL 1.2**, specifically *without* the "or any later version"
  clause, which blocks the CC BY-SA relicensing route that GFDL 1.3 opened.
- Legally redistributable with the full GFDL text and history. Practically: GFDL
  is a documentation licence that fits badly with code, the site's own creator
  has said on the record they wish they had chosen Creative Commons, and its
  invariant-section machinery would infect our `data/` tree for very little
  return — Rosetta Code tasks are "implement X in every language", which is the
  wrong shape for a judged single-language submission anyway.
- **Excluded on practical grounds**, not legal ones. Recorded so nobody
  re-litigates it.

---

## Blocked pending review

### APPS (Hendrycks et al.)
- Repo <https://github.com/hendrycks/apps> shows **MIT**, but the README is a
  download link and a citation. It does **not** state which sites the problems
  were scraped from, whether statements are redistributable, or whether test
  cases are included. All three are **unverified**.
- The dataset is widely understood to be scraped from Codeforces, Kattis and
  similar. If that is right, the MIT licence covers the *harness*, not the
  statements — structurally the same error as the "leetcode solutions repo" case
  above.
- **Do not import from APPS until the download's own licence file has been
  read.** This is the single most likely place for this project to acquire an
  infringement quietly, because the repo badge says MIT and looks settled.

### Exercism
- Could not confirm the content licence from the org's landing repo; the
  material has moved across repositories. **Unverified.** Exercism is a strong
  fit for Tier 0 in principle (small, learner-facing, multi-language) and is
  worth resolving before authoring Tier 0 from scratch.

---

## The code/data split

Non-commercial and share-alike corpora are usable for CodeLock — it is free and
non-commercial — but they are **not free by OSI standards**, and shipping them
inside the source tree would make a contributor's reasonable assumption ("this
repo is MIT, so I can use any of it") false.

So:

```
data/
  LICENSE        # explains the split; per-source terms
  NOTICE         # generated, per-source attribution incl. Project Euler's wording
  <source>/...   # NC/SA statement content
```

- NC/SA content lives only under `data/`, never in `apps/` or `packages/`.
- The root `README` states the split explicitly.
- `data/NOTICE` is **generated** during Phase 7 ingestion from the per-row
  provenance columns, so it cannot drift from what was actually imported.

---

## Pattern taxonomy (from the canonical lists — facts, freely used)

Family ordering as fixed by the project brief, matching the NeetCode 150 shape.
Counts are Tier 1 canonical problems; Tier 2 adds three variations each.

| # | Family | Tier 1 | Depends on (Tier 0.5) |
|---|---|---|---|
| 1 | Arrays & Hashing | 9 | dynamic array, hash table, hash set |
| 2 | Two Pointers | 5 | dynamic array |
| 3 | Sliding Window | 6 | hash table |
| 4 | Stack | 7 | stack |
| 5 | Binary Search | 7 | dynamic array |
| 6 | Linked List | 11 | singly/doubly linked list |
| 7 | Trees | 15 | BST, traversals |
| 8 | Tries | 3 | trie |
| 9 | Heap / Priority Queue | 7 | binary heap, priority queue |
| 10 | Backtracking | 9 | recursion only |
| 11 | Graphs | 13 | adjacency list, queue, union-find |
| 12 | Advanced Graphs | 6 | indexed PQ, union-find |
| 13 | 1-D DP | 12 | dynamic array |
| 14 | 2-D DP | 11 | — |
| 15 | Greedy | 8 | — |
| 16 | Intervals | 6 | — |
| 17 | Math & Geometry | 8 | — |
| 18 | Bit Manipulation | 7 | — |
| | **Total** | **150** | |

The dependency column is not decoration — it is the Phase 5 unlock rule. A user
builds the heap before being served heap problems.

**Ordering note.** Blind 75, NeetCode 150 and Grind 75 agree on the families and
very nearly on the order; where they differ it is Grind 75 front-loading by
frequency rather than by prerequisite. We follow the prerequisite ordering,
because our audience is learning, not revising.

**What no list covers: Tier 0 and Tier 0.5.** Every canonical list starts at
"you can already program". Tier 0 (~60: loops, strings, arrays, hashmaps, I/O
parsing) and Tier 0.5 (~55: *build* the structure) have no upstream list and
must be authored. The freeCodeCamp DSA syllabus is the closest published
ordering for Tier 0.5 and is used as the spine.

**Explicitly out of scope**, per the brief: suffix arrays at any tier; AVL,
Fenwick and segment trees are Tier 3 optional only.

---

## Sources worth asking for permission

Ranked by value-to-effort. **Drafted, not sent.**

1. **CSES** (Antti Laaksonen, University of Helsinki) — ~300 curated problems, an
   excellent difficulty ladder, and an author already committed to free
   educational material. Highest value.
2. **Exercism** — resolve the licence first; a request may be unnecessary.
3. **Kattis / Open Kattis** — statements are individually authored and rights are
   fragmented; likely a no, cheap to ask.
4. **AtCoder** — has an English archive and a permissive culture around
   educational reuse; **unverified** whether that extends to redistribution.

### Draft email — CSES

> **Subject:** Permission request — CSES Problem Set statements for a free,
> open-source learning tool
>
> Dear Professor Laaksonen,
>
> I am building CodeLock, a free and open-source, non-commercial tool that helps
> people learning to program — many of them career-changers who are still early
> enough that a standard interview problem set is out of reach. It locks the
> user's screen on a schedule and releases it when they solve a problem, and it
> shows the pattern name, an editorial and a reference solution afterwards
> whether or not they succeeded.
>
> I would like to ask permission to include the CSES Problem Set statements in
> the tool's problem corpus. Concretely: would you allow redistribution of the
> statement text within an openly licensed, non-commercial project, and if so
> under what terms and with what attribution wording?
>
> If it helps: the corpus is stored separately from the source code, each problem
> carries its source, licence and a link back to the original, and I would gladly
> place CSES material under any specific licence or notice you prefer. I am not
> asking for the test data, and not for anything that would let someone bypass
> solving on cses.fi.
>
> I could not find licence terms on the problem set pages, which is why I am
> asking rather than assuming. If the answer is no, that is entirely understood
> and I will not use the material.
>
> Thank you for the Problem Set and for the Competitive Programmer's Handbook —
> both have taught a great many people.
>
> With thanks,
> [name]
> [project URL]

The same letter serves the other three with the obvious substitutions. Note that
it asks a *specific* question and states what happens on refusal; a vague "can I
use your content?" reliably gets no reply.

---

## Standing rules that follow from this research

1. Never ingest LeetCode statement text, from any source, including permissively
   licensed mirrors.
2. A source with no stated licence is excluded, not assumed permissive.
3. NC/SA content never enters the code tree.
4. Every imported row carries non-null `source`, `sourceUrl`, `sourceLicense`,
   `attributionText`, `sourceRef` — attribution per problem, because
   CodeContests alone spans five upstream licences.
5. `data/NOTICE` is generated from those columns, never hand-maintained.
6. When a licence cannot be confirmed from a primary source, write **unverified**
   and stop.
