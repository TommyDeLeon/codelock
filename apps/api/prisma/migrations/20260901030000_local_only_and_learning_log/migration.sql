-- CodeLock becomes a local, single-learner commitment device.
--
-- Accounts and integrations are removed. There is nobody to authenticate
-- against on a machine that already authenticates its owner, and the OAuth
-- surface only ever existed to authorise pushing solves outward. Dropping it
-- also removes the failure this product could least afford: the lock screen
-- borrowed a session from the desktop shell, and a request that raced that
-- borrow stranded the user on "Missing bearer token" with a running timer.
--
-- learning_events replaces the generated case study. A case study was written
-- for someone else to read as evidence; this is written for the learner, as it
-- happens, and it keeps the failures and the skips as well as the solves.
--
-- Destructive by intent: refresh_tokens, oauth_accounts, integrations and
-- sync_records hold only credentials and push history for features that no
-- longer exist. Nothing here holds a problem, a submission or any progress.

-- CreateEnum
CREATE TYPE "LearningEventKind" AS ENUM ('TIMER_ARMED', 'LOCK_ENGAGED', 'PROBLEM_SERVED', 'ATTEMPT_FAILED', 'ATTEMPT_PASSED', 'DEBRIEF_OPENED', 'LOCK_BYPASSED', 'DIFFICULTY_CHANGED');

-- DropForeignKey
ALTER TABLE "integrations" DROP CONSTRAINT "integrations_userId_fkey";

-- DropForeignKey
ALTER TABLE "oauth_accounts" DROP CONSTRAINT "oauth_accounts_userId_fkey";

-- DropForeignKey
ALTER TABLE "refresh_tokens" DROP CONSTRAINT "refresh_tokens_userId_fkey";

-- DropForeignKey
ALTER TABLE "sync_records" DROP CONSTRAINT "sync_records_integrationId_fkey";

-- DropForeignKey
ALTER TABLE "sync_records" DROP CONSTRAINT "sync_records_submissionId_fkey";

-- DropTable
DROP TABLE "integrations";

-- DropTable
DROP TABLE "oauth_accounts";

-- DropTable
DROP TABLE "refresh_tokens";

-- DropTable
DROP TABLE "sync_records";

-- DropEnum
DROP TYPE "IntegrationProvider";

-- DropEnum
DROP TYPE "OAuthProvider";

-- DropEnum
DROP TYPE "SyncStatus";

-- CreateTable
CREATE TABLE "learning_events" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "kind" "LearningEventKind" NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "problemSlug" TEXT,
    "problemTitle" TEXT,
    "difficulty" "Difficulty",
    "tier" "Tier",
    "patternFamily" "PatternFamily",
    "language" "Language",
    "attempt" INTEGER,
    "elapsedSeconds" INTEGER,
    "detail" JSONB,

    CONSTRAINT "learning_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "learning_events_userId_at_idx" ON "learning_events"("userId", "at");

-- CreateIndex
CREATE INDEX "learning_events_userId_kind_at_idx" ON "learning_events"("userId", "kind", "at");

-- AddForeignKey
ALTER TABLE "learning_events" ADD CONSTRAINT "learning_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

