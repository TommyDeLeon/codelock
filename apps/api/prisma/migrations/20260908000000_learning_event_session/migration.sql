-- Tie each logged step to the lock session it happened in.
--
-- The log was a flat stream, so "what happened in that session" could only be
-- answered by guessing at time windows — ambiguous the moment the same problem
-- comes up twice in an evening.
--
-- Nullable, and no backfill: TIMER_ARMED happens before a session exists and
-- DIFFICULTY_CHANGED belongs to no single lock, so null is a real value here
-- rather than missing data. Rows written before this migration keep null for
-- ever, and the review says so rather than reconstructing a session it cannot
-- prove.
--
-- Deliberately not a foreign key. This table already denormalises problem title
-- and difficulty so the log survives a problem being reworded; a cascade delete
-- from lock_sessions would erase the record of exactly the sessions worth
-- reviewing.
ALTER TABLE "learning_events" ADD COLUMN "sessionId" UUID;

CREATE INDEX "learning_events_sessionId_at_idx" ON "learning_events"("sessionId", "at");
