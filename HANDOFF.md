# Handoff

Working notes for whoever picks this up next, including a Codex session. Kept
because direct agent-to-agent communication was not available: the Codex CLI is
installed and the ChatGPT login is active, but every task returned a usage-limit
error, so no work was exchanged with it. Nothing in this file was produced by or
agreed with another assistant.

Last updated after the commit `inspection`.

## Decisions made, and why

**Hints are derived per problem, not per pattern family.** They were built from
one `BY_FAMILY` table with a single tag substitution, so all ~695 problems
collapsed onto about 17 hint sets and the third hint was identical across dozens
of problems. They are now assembled from three independent per-problem sources:
the most specific `patternTags` entry, the `signatureId`, and a check taken from
the problem's own test data. Measured: 611 distinct trios, up from 266.

**The third hint quotes the problem's real test case.** A category fact such as
"negative numbers are in the checks" is true of forty problems at once. An
instruction to trace one concrete case cannot be generic, because no two
problems share test data, and tracing a case by hand is how most people find
their own bug.

**Test-case stdin is parsed line by line, never split on all whitespace.** A
`fn:ints,int->int` case is the list on line one and the scalar on line two. The
first version flattened both, then announced a duplicate or a negative that was
really the second argument. A hint that names a boundary the problem does not
have is worse than a generic one.

**Three help levels, never merged.** `unaided`, `after_hints`,
`after_editorial`. The third is never recorded as demonstrated mastery under any
wording. The evidence window is bounded by the submission's own `createdAt`
rather than the wall clock, so opening the editorial after a solve cannot
retroactively demote it, and the grade queue finishing out of order cannot
either.

**The results pane has a height floor as well as a cap.** `max-h-[45%]` alone
gave it about 105px on a 700px-high window, under three of five test rows.
`min-h-[13rem]` takes the space from the editor on short windows, which is the
right trade when reading a failure rather than typing.

**Migrations are additive only.** Enum values are added with
`ADD VALUE IF NOT EXISTS`. Note that Postgres cannot drop an enum value, so
`CAPABILITY_RECORDED` is effectively one-way; it is inert unless code writes it.

## Files changed so far

| Path | Change |
|---|---|
| `apps/api/src/services/hints.ts` | Rewritten derivation: `BY_SIGNATURE` (55 entries), `primaryList`, `traceHint`, `whyThisCase`, `dedupe` |
| `apps/api/src/routes/lock.ts` | Hint route loads the problem's `isSample` cases and passes them through |
| `apps/api/src/services/lockSessions.ts` | Debrief passes the cases it already had to `hintsFor` |
| `apps/api/scripts/verify-hints.ts` | New. Measures hint variety across the corpus with no database |
| `apps/api/package.json` | Added the `verify:hints` script |
| `apps/api/src/services/capabilities.ts` | New. Capability sentence plus the three help levels |
| `apps/api/src/services/grading.ts` | Records a capability after the unlock, never awaited |
| `apps/api/prisma/schema.prisma` | Added `CAPABILITY_RECORDED` to `LearningEventKind` |
| `apps/api/prisma/migrations/20260911120000_capability_recorded/` | New, additive |
| `apps/web/src/components/lock/test-case-row.tsx` | `describeMismatch` covers absent values, empty expected, and type mismatches |
| `apps/web/src/components/lock/lock-workspace.tsx` | Height floor on the results pane |
| `RESEARCH.md` | New. Evidence, limitations, and what is unverified |

## Verification actually performed

Against the running stack, not in theory. Docker was already up with postgres,
judge, api and web; the api and web images were rebuilt so the changes were
live, because neither container mounts source.

- `npm run typecheck` clean across all workspaces.
- Migration applied with `prisma migrate deploy`; the enum value confirmed
  present by querying `pg_enum` directly.
- Two real lock sessions engaged through the API. Two different problems
  produced genuinely different hints, confirmed in the browser as well as in
  the API response.
- A correct solution submitted: `ACCEPTED`, 6/6 cases, unlock token issued, so
  the unlock path still works after the grading change.
- The capability row confirmed in the database: `level: after_hints`,
  `demonstratesMastery: true`, sentence naming the problem.
- A wrong solution submitted through the UI. The failing case expands and shows
  input `(empty input)`, expected `(expected: no output at all)`, actual
  `undefined`, plus the explanation.
- At a 900x700 viewport, all five case rows are focusable and the browser
  scrolls each into view on focus. The inner scroller went from 105px to 169px.
- Hint variety re-measured after every change with `verify:hints`.

## Known problems, stated plainly

- **The capability sentence is written but never displayed.** It lands in
  `learning_events` correctly and no screen reads it yet.
- **Two lock sessions may still be live** on the local user from testing. Skip,
  abandon or solve them.
- **`describeMismatch` cannot show whitespace visibly.** It names a trailing
  space or a stray blank line in words instead, because rendering a marker
  risks the learner thinking the marker is part of the output.
- **Codex was never reachable.** Its review of the hint derivation did not
  happen, so that code has had no independent adversarial read.

## Remaining work, in priority order

1. **Prerequisite-aware progression.** The existing `progression.ts` gates by
   tier and `difficulty.ts` moves EASY to HARD on solve speed, but there is no
   beginner Python skill path and no per-skill state. Needs: the six skill
   groups from the brief, four states per skill (not introduced, practised with
   help, demonstrated independently, due for review), selection that respects
   prerequisites, and a skippable calibration with a start-from-basics option.
   One correct answer must not count as mastery.
2. **Spaced retrieval.** `retrieval.ts` plus its table.
3. **Session flow controls:** too hard, too easy, explain differently, low
   energy. Low energy should offer one small activity and record participation
   without mastery.
4. **Surface the capability sentence** somewhere the learner sees it.
5. **Show the skill map and the collection of completed mini-programs.**

## Conventions to keep

- Commit subjects are exactly one word, bodies empty. Stage only relevant files.
- No AI watermarks anywhere: not in commits, code, comments, docs, or assets.
- Comments explain why a decision was made, not what a line does.
- Learner-visible text is plain language and short sentences.
- Never record assistance as independent mastery.
