# CodeLock batch authoring brief

You are authoring a batch of coding problems for the CodeLock corpus.

## Read first (mandatory, in this order)
1. `docs/AUTHORING.md` — the full contract. Every rule there is load-bearing.
2. `apps/api/src/corpus/problems/tier2-two-pointers.ts` — the exact style/format
   target. Match its density, its prose voice, and its formatting exactly.
3. `apps/api/src/corpus/signatures.ts` — the ONLY signature ids that exist.

## Output
Write exactly one new file at the path given in your task, exporting one
`ProblemDefinition[]` const named as given. Do not touch any other file.
Do NOT edit `index.ts` — it is generated.

## Hard rules (each has cost a batch before)
- All six languages: JAVASCRIPT, TYPESCRIPT, PYTHON, JAVA, CPP, GO. Never five.
- Go driver imports ONLY `bufio fmt os strconv strings`. No `sort`, no `math`.
  Write helpers inline. Go methods on driver-called types are Capitalised.
- C++ compile errors are invisible on the judge. Include what you use:
  `<algorithm>` for `sort`/`reverse`, `<queue>` for `queue`/`priority_queue`,
  `<map>`, `<set>`, `<unordered_map>`. Never assume a transitive include.
- Java is single-file source mode. Free functions are `static`, indented 4
  spaces, inside `Main`. Never declare a second `public` class.
- `ListNode`/`TreeNode` come from the driver. Never redeclare them.
- Every `signatureId` MUST already exist in `signatures.ts`. Grep it first.
  Reshape the problem rather than adding a signature.
- Unordered answers are unspecifiable: the judge compares stdout exactly. Either
  state the exact total order in the statement and emit it, or return a count.
- Exponential/backtracking problems: keep n <= 10, and n <= 8 if factorial.
- 4 tests minimum, 5-6 preferred. Exactly 2 marked `isSample: true`.
- Compute every `expectedStdout` BY HAND. A wrong expectation costs a judge round trip.
- Avoid empty-array inputs; state a guarantee ("at least one number") instead.

## Quality rules (these are why a batch gets rejected)
- **Every editorial needs its OWN `## heading`.** A batch where all problems
  share one templated heading is rejected outright. The editorial is 200+ chars,
  names the pattern, explains WHY it works, names the specific quiet mistake this
  problem invites, and ends with complexity and what bounds it.
- **Every problem needs its OWN reference solution.** Two problems sharing one
  solution means they are one problem under two names.
- Statements: say what goes in, what comes out, give a worked example in a
  fenced block, and NAME the edge case rather than hiding it. Short — this is
  read at 11pm with the screen locked.
- Never copy or paraphrase a LeetCode statement. Write it from the task, as you
  would explain it at a whiteboard.
- Slugs are globally unique across the whole corpus. Before choosing slugs run:
  `grep -rhoE "slug: *'[a-z0-9-]+'" apps/api/src/corpus/problems/ | sort -u`
  and make sure none of yours collide.

## Verify before you report done
```
node scripts/check-batch.mjs <your file>
```
It must print your problem count and ZERO `FAIL` lines. Fix everything it flags
and re-run until clean. Report the final check-batch output verbatim.

## The failure mode that has wasted the most work

Three separate batches have shipped a **solution factory that gives every
problem the same program**, and all three passed the structural checker:

```ts
const six = (tag: string) => ({ PYTHON: `def solve(a):\n # ${tag}\n ...` });   // WRONG
const six = (kind: string) => ({ PYTHON: `... if k=='rotate180': ...\n return 0` }); // WRONG
```

The first gives twelve problems one traversal separated only by a comment. The
second is a dispatcher that silently returns `0` for every branch it never
implemented. Both read as authored work. Neither is.

**The only factory shape allowed is a six-argument passthrough**, where every
call supplies six real, different solutions:

```ts
const six = (JAVASCRIPT: string, TYPESCRIPT: string, PYTHON: string,
             JAVA: string, CPP: string, GO: string) => ({
  JAVASCRIPT, TYPESCRIPT, PYTHON, JAVA, CPP, GO });
```

`check-batch.mjs` now fails any factory with fewer than six parameters used by
more than one problem. Do not try to satisfy it by widening the signature while
still passing one shared body — the point is that **problem N's solution must
actually solve problem N**. Write each one out.

The same applies to statements and editorials: a helper may supply shared
*scaffolding*, but every problem's specific explanation, its named quiet
mistake, and its complexity line must be passed in per problem.
