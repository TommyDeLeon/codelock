-- Spaced retrieval of pattern families already solved once.
--
-- A solve proves the idea worked once, with the problem in front of you and
-- the pattern freshly primed. It says nothing about next month. This table
-- tracks, per user and per pattern family, when that family is next due for
-- a short recall question — on an expanding interval capped at 60 days —
-- so the idea gets revisited before it fades rather than only if a later
-- problem happens to reuse it.
--
-- A wrong recall resets the interval to one day and does nothing else: no
-- difficulty change, no streak effect anywhere outside this table, no
-- penalty. That is enforced in application code (src/services/retrieval.ts),
-- not here, but the shape of this table is built for it — lapseCount is a
-- plain counter the learner can see, never an input to anything else.
--
-- Additive only: a new table, no change to any existing one. IF NOT EXISTS
-- throughout makes a re-run a no-op rather than an error, which matters
-- because this will meet databases already migrated by `prisma migrate dev`
-- during development.
CREATE TABLE IF NOT EXISTS "retrieval_schedules" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "patternFamily" "PatternFamily" NOT NULL,
    "nextDueAt" TIMESTAMP(3) NOT NULL,
    "intervalDays" INTEGER NOT NULL DEFAULT 1,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "lapseCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "retrieval_schedules_pkey" PRIMARY KEY ("id")
);

-- One schedule row per user-and-family pair: a family becomes due once, not
-- once per problem within it.
CREATE UNIQUE INDEX IF NOT EXISTS "retrieval_schedules_userId_patternFamily_key"
    ON "retrieval_schedules"("userId", "patternFamily");

-- The only query this table ever needs to serve fast: "what's due for this
-- user right now". Leads with userId because there is never a query across
-- users for a given due time.
CREATE INDEX IF NOT EXISTS "retrieval_schedules_userId_nextDueAt_idx"
    ON "retrieval_schedules"("userId", "nextDueAt");

DO $$ BEGIN
    ALTER TABLE "retrieval_schedules"
        ADD CONSTRAINT "retrieval_schedules_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
