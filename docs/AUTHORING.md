# Authoring problems

The contract for adding problems to the corpus. Follow it exactly — parallel
authors produce an inconsistent corpus otherwise, and inconsistency in a problem
set is indistinguishable from unfairness when the reader is a beginner with
their screen locked.

## The one non-negotiable

**Never copy a problem statement from LeetCode, or from any repository that
mirrors LeetCode statements.** A permissive licence on someone's solutions repo
covers their code, not LeetCode's prose.

What *is* free: the underlying task. "Find two numbers in an array that sum to a
target" is an idea, and ideas are not copyrightable. The canonical lists — which
patterns matter, in what order — are facts.

So: **write the statement yourself, from the task.** Do not paraphrase a
remembered statement sentence by sentence; state the problem as you would
explain it at a whiteboard. If your draft contains a distinctive turn of phrase
you did not invent, rewrite it.

Every authored problem uses the `AUTHORED` provenance constant (CC0).

## Shape

Each problem is a `ProblemDefinition` (`src/corpus/problem.ts`) in a
`src/corpus/problems/tier*.ts` array. It carries **no driver and no starter
code** — those are generated from `signatureId`. If a problem does not fit an
existing signature, reshape the problem; adding a signature costs six language
implementations plus a cross-language test round.

```ts
p({
  slug: 'kebab-case-unique',
  title: 'Title Case',
  difficulty: 'EASY' | 'MEDIUM' | 'HARD',
  tier: 'TIER_0' | 'TIER_0_5' | 'TIER_1' | 'TIER_2' | 'TIER_3',
  patternFamily: 'ARRAYS_HASHING' | ...,
  patternTags: ['two-pointers', 'prefix-sum'],
  signatureId: 'fn:ints->int',
  avgSolveSeconds: 180,
  promptMarkdown: [...].join('\n'),
  editorialMarkdown: [...].join('\n'),
  referenceSolution: { JAVASCRIPT, TYPESCRIPT, PYTHON, JAVA, CPP, GO },
  tests: [{ stdin, expectedStdout, isSample }],
  provenance: AUTHORED,
})
```

## The statement

- Say exactly what goes in and what comes out, with a worked example.
- **Name the edge case rather than hiding it.** A beginner under a lock does not
  need a trick; they need a fair problem. State what happens on empty input, on
  ties, on "not found".
- State any guarantee the solver may rely on ("the list always has at least one
  number"). Each guarantee removes one decision they would otherwise make blind.
- Keep it short. This is read at 11pm with the screen gone.

## The editorial

Written for someone who did **not** get it. It is shown after the lock resolves,
however it resolved, and it is the reason a failed evening is not a wasted one.

- Name the pattern, in a heading.
- Explain *why* the approach works, not just what it is.
- Name the specific mistake this problem invites, and why it is quiet.
- End with the complexity, and say what bounds it.
- 200+ characters, and never "left as an exercise".

## Reference solutions

**All six languages, always.** The debrief shows the user their own language;
five out of six means someone gets nothing.

Match the generated stub exactly:

| Language | Free function | Class (Tier 0.5) |
|---|---|---|
| JAVASCRIPT | `function solve(a, b) {}` | `class Name { ... }` |
| TYPESCRIPT | `function solve(a: number[], b: number): number[] {}` | `class Name { ... }` |
| PYTHON | `def solve(a, b):` | `class Name:` |
| JAVA | `    static int[] solve(int[] a, int b) {}` (indented, inside `Main`) | `class Name { ... }` (top level) |
| CPP | `vector<int> solve(vector<int> a, int b) {}` | `class Name { public: ... };` |
| GO | `func solve(a []int, b int) []int {}` | `type Name struct{}` + `func Constructor(...) Name` + **capitalised** methods |

Go method names are capitalised by the driver (`put` → `Put`); an unexported
method is invisible to it. Java runs in single-file source mode — do not declare
a second `public` class.

## Test cases

- **4 minimum**, 6+ preferred. `judgeability` scores on count, and below 3 a
  problem is barely judged at all.
- Mark 2 as `isSample: true` — those are the only ones the user sees.
- Always include the edge case the statement names: empty input, single element,
  all-equal, negatives, not-found.
- **Compute expected output by hand, then let the judge check you.** A wrong
  expectation is caught by `--measure` (all six languages disagreeing with you
  is the tell), but it costs a full round trip.

### Wire format

One parameter per stdin line, in order.

| Type | stdin | stdout |
|---|---|---|
| `int`, `double` | `42` | `42`, `2.500000` (6 dp) |
| `bool` | `true` | `true` / `false` |
| `string` | raw line | raw line |
| `int[]`, `string[]` | `1 2 3` | `1 2 3`; empty is an empty line |
| `int[][]` | `1 2;3 4` | `1 2;3 4` |
| `tree` | `1 2 3 null 4` (level order) | same, trailing nulls trimmed |
| `list` | `1 2 3` | `1 2 3` |

Operation log (Tier 0.5): line 1 is the operation count, then one
`opName arg arg` per line. Output is one line per operation, `null` for the
constructor and for void methods.

```
10
LRUCache 2
put 1 1
get 1
```

## Verifying

```bash
node scripts/check-batch.mjs apps/api/src/corpus/problems/<batch>.ts   # before wiring
node scripts/wire-corpus.mjs                                          # regenerate index.ts
npm test -w @codelock/api                                             # structural checks
npm run import:corpus -w @codelock/api -- --measure --only=<slugs>    # the judge
```

Run them in that order. The first three take seconds; the last is ~28 judge runs
per problem and answers about forty minutes later, so everything cheap should
have failed first.

**`check-batch.mjs`** catches what review misses and the judge charges for:
two problems sharing one reference solution (they are then the same problem
under two names — the most common defect this corpus has shipped), a missing
language, the wrong number of samples, `sort.`/`math.` in Go, `std::sort`
without `<algorithm>`, and truncation markers.

**`wire-corpus.mjs`** regenerates `problems/index.ts` from the directory. Do not
hand-edit that file. Wiring by hand is silent when it goes wrong: an unused
import type-checks, so a batch can sit fully authored and completely invisible
to every test. Six families once did, and it surfaced only when the importer
rejected 46 slugs as unknown. `--check` fails if the file has drifted, and
`src/corpus/wiring.test.ts` enforces the same invariant in the suite.

A problem whose reference solutions do not pass its own tests **imports as
INACTIVE and is never served**. That is the quality gate: it is not possible to
ship a problem that does not work, only one that does not exist yet.

Re-run `--measure` after any judge, image or language-version change. An
uncalibrated speed gate is not a slightly wrong number, it is a lockout.

## Gotchas that have actually cost a batch

Each of these was found by the judge, not by review, and each cost a full
measurement round trip. Check them before submitting a batch.

**The Go driver imports five packages, and only five.** `bufio`, `fmt`, `os`,
`strconv`, `strings`. `sort` and `math` are **not** available. A reference
solution calling `sort.Ints` or `math.Abs` does not fail review — it fails to
compile on the judge, and Go's error arrives long after you have moved on.
Write the helper inline.

**The judge hides C++ compile errors.** Its command is
`g++ ... 2>/tmp/cc.log && ./a.out`, so diagnostics go to a file nobody reads and
a compile failure surfaces as a *runtime error with empty output and empty
stderr*. Treat any empty-output C++ failure as a compile failure until proven
otherwise.

**Check the signature id exists before writing six solutions against it.**
`fn:list,int->int` looked obvious and does not exist; the problem had to be
reshaped after all six languages were written. Grep `signatures.ts` first. The
`list` family is `fn:list->list`, `fn:list->bool`, `fn:list->int`,
`fn:list,int->list`, `fn:list,list->list` — note there is no list-and-scalar to
scalar. Reshaping the problem is always cheaper than adding a signature.

**A driver-declared node type must not be redeclared.** `ListNode` and
`TreeNode` come from the generated driver in every language. Declaring your own
shadows or conflicts with it. In Java, `public class Main` must also come first
in the file — single-file source mode runs the first class it finds.

**An unordered answer needs an order in the statement.** The judge compares
stdout exactly, so "return all subsets" is not a specification. Either state the
total order the output must be in and produce exactly that, or reshape the
problem to return a count. This applies to every `int[][]` result.

**Exponential problems need small inputs.** Backtracking and permutation
problems run under a CPU limit. A twenty-element list will time out and the
problem will be held INACTIVE with no other symptom. Keep inputs to roughly ten
elements, and n <= 8 for anything factorial.

**An empty array is an empty line on the wire.** Round-tripping that is fragile.
Unless empty input is deliberately the edge case under test, state a guarantee
("the list always has at least one number") instead.

**Measure incrementally.** `--only=slug-a,slug-b` measures just those problems
and carries every other row's stored runtime forward. A full `--measure` is
~28 judge runs per problem; at ~25 runs/minute the whole corpus is many hours.
The importer measures everything *before* it writes, so interrupting a
measurement run is safe and changes nothing in the database.
