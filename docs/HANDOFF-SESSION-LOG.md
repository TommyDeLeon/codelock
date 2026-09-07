# Hand-off — session review

Read cold. One feature, not yet started, and the reason it is worth doing is
that most of it already exists and is invisible.

## The thing to build

A per-session review: open a past lock session and read what happened in it —
what was served, what was tried, what failed and why, how it ended. For
reviewing an evening afterwards rather than only living through it.

## What already exists

Do not rebuild any of this.

`learning_events` (`apps/api/prisma/schema.prisma`, ~line 544) already records
eight kinds: `TIMER_ARMED`, `LOCK_ENGAGED`, `PROBLEM_SERVED`, `ATTEMPT_FAILED`,
`ATTEMPT_PASSED`, `DEBRIEF_OPENED`, `LOCK_BYPASSED`, `DIFFICULTY_CHANGED`.
Attempt rows keep `sourceCode` verbatim, plus `attempt`, `elapsedSeconds`,
`submissionId`, and a `detail` JSON blob that already carries failed sample
cases with their expected and actual output.

`apps/api/src/services/learningLog.ts` exports `recordStep`, `timeline`,
`summary`, `reviewPacket` and `renderReviewPacket` — the last renders a
per-problem packet as markdown.

`apps/api/src/routes/log.ts` exposes `GET /v1/log`, `GET /v1/log/summary` and
`GET /v1/log/review/:slug`.

**Nothing in any UI consumes any of it.** The desktop dashboard's RUN LOG is
built from `lock_sessions` rows, not from these events, which is why it can say
"abandoned" and nothing more.

## The actual gap

`LearningEvent` has **no `sessionId`**. The log is a flat stream, so "what
happened in that session" can only be answered by guessing at time windows —
ambiguous the moment the same problem comes up twice in an evening.

The first step is therefore a migration, and that is why this was not started at
the end of a long session: a half-applied migration leaves the API unable to
boot.

## Suggested order

1. Add `sessionId String? @db.Uuid` to `LearningEvent`, plus an index on
   `[sessionId, at]`. Nullable on purpose — `TIMER_ARMED` happens before a
   session exists, and `DIFFICULTY_CHANGED` belongs to no single lock. Not a
   foreign key: this table already denormalises problem title and difficulty so
   the log survives a problem being reworded, and a cascade delete would erase
   the record of exactly the sessions worth reviewing.
2. `npx prisma migrate dev` in `apps/api`, then regenerate the client.
3. Thread `sessionId` through `StepInput` and the `recordStep` callers.
   `apps/api/src/services/grading.ts` holds the attempt paths and already has
   `session` in scope; check `routes/lock.ts` for the engage and abandon paths.
4. Add `sessionReview(userId, sessionId)` beside `reviewPacket`, and a renderer
   for it. Follow `renderReviewPacket`'s shape — its prompt-at-the-top decision
   is deliberate and explained in its docblock.
5. Expose `GET /v1/log/session/:id`.
6. Surface it. The desktop dashboard's RUN LOG rows are the obvious entry point:
   a run becomes clickable and opens its review.

## Worth knowing

Rows written before the migration will have `sessionId` null for ever. Decide
whether the review hides those sessions or reconstructs them best-effort, and
say which in the interface rather than rendering a blank.

The verdict panel's case rows became clickable in the session this work was
deferred from — `apps/web/src/components/lock/test-case-row.tsx`. That component
already renders input, expected, actual, stderr and a plain-English mismatch
hint for sample cases, and refuses to reveal hidden ones. A session review
showing a failed attempt should reuse it rather than growing a second renderer
that can drift from it.

`npm run lint -w @codelock/web` fails on `main` and always has: there is no
`eslint.config.*` in that workspace. Not caused by recent work. Fix it or ignore
it deliberately, but do not read it as a regression.
