-- Indexes for the selection query and for three unindexed foreign keys.
--
-- The selection query filters on (difficulty, isActive, tier, patternFamily)
-- simultaneously once the curriculum gate is applied. The existing indexes each
-- cover a prefix of that, so the planner could use only one and re-filter the
-- rest. Latent at ~100 rows; the corpus target is ~695.
--
-- The three foreign keys had no index of their own. Postgres needs the
-- referencing side indexed to avoid a full scan of the child table when a
-- parent row is deleted or its key updated, and any "how many submissions has
-- this problem had" query was a sequential scan.
--
-- CREATE INDEX takes an ACCESS EXCLUSIVE lock for its duration. At this table
-- size that is milliseconds. On a large table use CREATE INDEX CONCURRENTLY,
-- which cannot run inside a transaction and so cannot live in a Prisma
-- migration without --create-only.
CREATE INDEX "problems_difficulty_isActive_tier_patternFamily_idx"
  ON "problems" ("difficulty", "isActive", "tier", "patternFamily");

CREATE INDEX "submissions_problemId_idx" ON "submissions" ("problemId");

CREATE INDEX "lock_sessions_problemId_idx" ON "lock_sessions" ("problemId");

CREATE INDEX "lock_sessions_deviceId_idx" ON "lock_sessions" ("deviceId");
