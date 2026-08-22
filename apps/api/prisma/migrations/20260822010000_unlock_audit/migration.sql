-- CreateEnum
CREATE TYPE "UnlockOutcome" AS ENUM ('SOLVED', 'SKIPPED', 'ABANDONED', 'REAPED');

-- CreateTable
CREATE TABLE "unlock_audits" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "lockSessionId" UUID NOT NULL,
    "problemId" UUID,
    "outcome" "UnlockOutcome" NOT NULL,
    "submissionId" UUID,
    "runtimeMs" INTEGER,
    "gateMs" INTEGER,
    "secondsLocked" INTEGER,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "unlock_audits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "unlock_audits_userId_createdAt_idx" ON "unlock_audits"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "unlock_audits_outcome_createdAt_idx" ON "unlock_audits"("outcome", "createdAt");

-- AddForeignKey
ALTER TABLE "unlock_audits" ADD CONSTRAINT "unlock_audits_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
