-- Opt-in difficulty focus.
--
-- Every existing timer config becomes AUTOMATIC with no focus, and every
-- existing lock session is recorded as AUTOMATIC, which is what each of them
-- was. Nothing about UserProgress changes: the automatic tier and its streaks
-- are untouched by this migration and by the feature.

CREATE TYPE "DifficultyMode" AS ENUM ('AUTOMATIC', 'MANUAL');

ALTER TABLE "timer_configs"
  ADD COLUMN "difficultyMode" "DifficultyMode" NOT NULL DEFAULT 'AUTOMATIC',
  ADD COLUMN "focusDifficulty" "Difficulty";

-- A focus exists exactly when the mode is MANUAL. The API validates the same
-- rule; this makes it impossible to store an incoherent pair by any path.
ALTER TABLE "timer_configs"
  ADD CONSTRAINT "timer_configs_difficulty_focus_check" CHECK (
    ("difficultyMode" = 'AUTOMATIC' AND "focusDifficulty" IS NULL)
    OR ("difficultyMode" = 'MANUAL' AND "focusDifficulty" IS NOT NULL)
  );

ALTER TABLE "lock_sessions"
  ADD COLUMN "difficultySource" "DifficultyMode" NOT NULL DEFAULT 'AUTOMATIC';
