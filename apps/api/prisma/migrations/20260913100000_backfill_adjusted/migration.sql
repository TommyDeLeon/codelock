-- Restore the "adjusted" fact for sessions swapped before the column existed.
--
-- 20260913090000_assignment_revision added lock_sessions.adjusted with a
-- default of false for every existing row. A session the learner had already
-- swapped, and that was still LOCKED at upgrade time, would then read as
-- unadjusted — and abandoning it afterwards could demote them for having said
-- the problem was too hard. Found in review. That migration is already
-- applied, so it is not edited; this one repairs its result.
--
-- Before the column, a swap left two traces in the log: a SESSION_FLOW row
-- whose detail.result is 'replaced', and a second PROBLEM_SERVED row for the
-- session. Either one is enough. Both are checked because both were written
-- fire-and-forget, so either could be the one that was lost.
--
-- Only ever sets true. A session with no trace of a swap keeps false, which is
-- what it was. Safe to re-run.

UPDATE "lock_sessions" AS ls
SET "adjusted" = true
WHERE ls."adjusted" = false
  AND (
    EXISTS (
      SELECT 1
      FROM "learning_events" AS e
      WHERE e."sessionId" = ls."id"
        AND e."kind" = 'SESSION_FLOW'
        AND e."detail"->>'result' = 'replaced'
    )
    OR (
      SELECT count(*)
      FROM "learning_events" AS e
      WHERE e."sessionId" = ls."id"
        AND e."kind" = 'PROBLEM_SERVED'
    ) > 1
  );
