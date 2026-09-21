-- Why a session ended without a solve, in the learner's own words.
--
-- Separate from escape_reason, which records how they left rather than why.
-- Only TOO_HARD should count against the difficulty ladder: the others
-- describe a moment, not a difficulty, and a device that makes the next
-- problems easier because a timer fired at a bad time has learned the wrong
-- lesson from it.
--
-- Nullable with no default, deliberately. Null means "not asked, or not
-- answered", which is a different thing from any of the four answers, and
-- backfilling existing rows with a guess would invent history.

CREATE TYPE "AbandonReason" AS ENUM ('TOO_HARD', 'NO_TIME', 'WRONG_MOMENT', 'NOT_TONIGHT');

ALTER TABLE "lock_sessions" ADD COLUMN "abandonReason" "AbandonReason";
