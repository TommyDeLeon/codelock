-- Give each problem assignment on a lock session its own identity.
--
-- Once a learner can swap the problem under a live lock, "the session is on
-- problem A" stops being enough to tell one assignment from another. Submit A,
-- swap to B, swap back to A, and the judge result for the first A still
-- matches LOCKED + problemId = A, so it would release a lock the learner is
-- working on afresh. A revision that increments on every swap closes that:
-- a submission records the revision it was graded against, and the release is
-- conditional on the session still holding that same revision.
--
-- `adjusted` records that a swap happened, in the same conditional update that
-- performs the swap. It was previously inferred from counting PROBLEM_SERVED
-- log rows, which are written fire-and-forget and can be lost; a lost row
-- silently removed the protection that stops "too hard" from costing a
-- demotion. A column written atomically with the change cannot be lost that
-- way.
--
-- Fully reversible, unlike the enum additions before it: these are plain
-- columns with defaults and can be dropped.

ALTER TABLE "lock_sessions" ADD COLUMN "problemRevision" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "lock_sessions" ADD COLUMN "adjusted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "submissions" ADD COLUMN "problemRevision" INTEGER;
