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
npm run import:corpus -w @codelock/api -- --measure   # runs every solution on the judge
npm test -w @codelock/api                             # structural checks
```

A problem whose reference solutions do not pass its own tests **imports as
INACTIVE and is never served**. That is the quality gate: it is not possible to
ship a problem that does not work, only one that does not exist yet.

Re-run `--measure` after any judge, image or language-version change. An
uncalibrated speed gate is not a slightly wrong number, it is a lockout.
