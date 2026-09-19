-- Learn: one event kind and one table.
--
-- LESSON records a step in a lesson (started, resumed, check, practice
-- begun, finished, correction) with the step named in detail.action. It is
-- participation, not evidence: the skill snapshot never reads it.
--
-- lesson_sessions holds where a learner is in each lesson so it can be
-- resumed after a restart, plus the graded check results keyed by the
-- client's attemptId so a retried request cannot be counted twice. One row
-- per learner and lesson.
--
-- Additive and idempotent, like the kinds before it. Rollback: DROP TABLE
-- "lesson_sessions" loses only resumption state; the enum value stays, unused,
-- as Postgres cannot remove one.
ALTER TYPE "LearningEventKind" ADD VALUE IF NOT EXISTS 'LESSON';

CREATE TABLE IF NOT EXISTS "lesson_sessions" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "lessonId" TEXT NOT NULL,
    "language" "Language" NOT NULL,
    "contentVersion" TEXT NOT NULL,
    "step" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "version" INTEGER NOT NULL DEFAULT 1,
    "draft" JSONB NOT NULL DEFAULT '{}',
    "checks" JSONB NOT NULL DEFAULT '{}',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lesson_sessions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "lesson_sessions_userId_lessonId_key" ON "lesson_sessions"("userId", "lessonId");
CREATE INDEX IF NOT EXISTS "lesson_sessions_userId_status_updatedAt_idx" ON "lesson_sessions"("userId", "status", "updatedAt");

ALTER TABLE "lesson_sessions" ADD CONSTRAINT "lesson_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
