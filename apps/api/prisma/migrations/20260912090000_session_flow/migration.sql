-- Session-flow controls: the learner can say a problem is too hard, too easy,
-- or that they have no energy for it tonight.
--
-- Two enum values, and both are deliberate. Neither fact has an honest home in
-- the existing vocabulary: no LearningEventKind describes asking for a
-- different problem or answering a warm-up question, and no UnlockOutcome
-- describes ending a lock by taking part rather than by solving, skipping or
-- giving up. Encoding participation as SKIPPED would spend nothing but would
-- write down something untrue, which is the failure this product is built to
-- avoid.
--
-- FORWARD ONLY. Postgres cannot drop a value from an enum type, so this is a
-- permanent commitment rather than a reversible change. Rolling the code back
-- leaves the values in place and unused, which is safe; "rollback" in the
-- sense of removing them is not available at all without rewriting the type.
-- Readers must be deployed before writers.

ALTER TYPE "LearningEventKind" ADD VALUE IF NOT EXISTS 'SESSION_FLOW';
ALTER TYPE "UnlockOutcome" ADD VALUE IF NOT EXISTS 'PARTICIPATED';
