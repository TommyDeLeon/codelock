-- Time budget, and when the speed gate applies.
--
-- Two settings with one purpose: make an abandoned session less likely by
-- letting the learner say how long they have, and by not measuring speed on a
-- problem they have never solved.
--
-- Existing rows take the new defaults, which change behaviour deliberately:
-- every learner moves to a 30-minute ceiling and to a first-solve gate. That
-- is the intended migration, not an accident of DEFAULT — the previous
-- always-on gate is available as ALWAYS for anyone who wants it back.

CREATE TYPE "SpeedGateMode" AS ENUM ('AFTER_FIRST_SOLVE', 'ALWAYS');

ALTER TABLE "timer_configs"
  ADD COLUMN "timeBudgetMinutes" INTEGER NOT NULL DEFAULT 30,
  ADD COLUMN "speedGateMode" "SpeedGateMode" NOT NULL DEFAULT 'AFTER_FIRST_SOLVE';

-- A budget must be a usable amount of time. The ceiling keeps a typo from
-- disabling selection entirely; the floor keeps it above the shortest problems
-- in the corpus.
ALTER TABLE "timer_configs"
  ADD CONSTRAINT "timer_configs_time_budget_check" CHECK (
    "timeBudgetMinutes" BETWEEN 3 AND 180
  );

-- Snapshots. Grading reads these rather than the live config, so a setting
-- changed while the screen is held cannot affect the session holding it.
ALTER TABLE "lock_sessions"
  ADD COLUMN "speedGateMode" "SpeedGateMode" NOT NULL DEFAULT 'AFTER_FIRST_SOLVE',
  ADD COLUMN "timeBudgetMinutes" INTEGER,
  ADD COLUMN "overBudget" BOOLEAN NOT NULL DEFAULT false;

-- Sessions that predate the feature were graded under the always-on gate.
-- Recording them as ALWAYS keeps the history honest: a replay of an old
-- session must not claim a gate rule that did not apply to it.
UPDATE "lock_sessions" SET "speedGateMode" = 'ALWAYS';
