-- Three hints per problem, and a log row when one is used.
--
-- The corpus ships with this empty. `hintsFor()` derives three hints from the
-- pattern family and the problem's constraints whenever the column is empty,
-- so every one of the ~695 problems has hints immediately and an authored trio
-- simply overrides the derived one. Authoring 2,000 hints up front would have
-- meant shipping nothing for months.
ALTER TABLE "problems" ADD COLUMN "hints" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Revealing a hint is free and never penalised, but it is recorded. Which
-- problems needed help is the single most useful thing the log can tell you
-- when you read it back, and a history that hides the help is the highlight
-- reel this log exists not to be.
ALTER TYPE "LearningEventKind" ADD VALUE IF NOT EXISTS 'HINT_REVEALED';
