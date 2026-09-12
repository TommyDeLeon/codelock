-- Recover the remaining evidence of a swap made before `adjusted` existed.
--
-- 20260913100000_backfill_adjusted marks a session adjusted when it finds a
-- SESSION_FLOW row with result 'replaced', or more than one PROBLEM_SERVED row.
-- Review found a case both miss: the initial PROBLEM_SERVED write was lost, the
-- swap's SESSION_FLOW write was lost too, but the swap's own PROBLEM_SERVED row
-- survived. That leaves one served row and no flow row, so the session stayed
-- unadjusted — and abandoning it could still move the difficulty ladder.
--
-- The surviving row is not ambiguous. A swap's PROBLEM_SERVED detail has always
-- carried `replacedProblemId` and `request`; the initial serve never did. Either
-- key alone identifies a swap.
--
-- Only ever sets true, and safe to re-run. `detail` is jsonb, so `?` tests for a
-- top-level key.

UPDATE "lock_sessions" AS ls
SET "adjusted" = true
WHERE ls."adjusted" = false
  AND EXISTS (
    SELECT 1
    FROM "learning_events" AS e
    WHERE e."sessionId" = ls."id"
      AND e."kind" = 'PROBLEM_SERVED'
      AND (e."detail" ? 'replacedProblemId' OR e."detail" ? 'request')
  );
