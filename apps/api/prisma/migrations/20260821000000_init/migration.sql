-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "Language" AS ENUM ('JAVASCRIPT', 'PYTHON', 'JAVA', 'CPP', 'GO');

-- CreateEnum
CREATE TYPE "LockState" AS ENUM ('ARMED', 'LOCKED', 'UNLOCKED', 'BYPASSED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('QUEUED', 'RUNNING', 'ACCEPTED', 'ACCEPTED_TOO_SLOW', 'WRONG_ANSWER', 'COMPILE_ERROR', 'RUNTIME_ERROR', 'TIME_LIMIT_EXCEEDED', 'MEMORY_LIMIT_EXCEEDED', 'INTERNAL_ERROR');

-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('WEB', 'WINDOWS', 'MACOS', 'LINUX', 'ANDROID', 'IOS');

-- CreateEnum
CREATE TYPE "IntegrationProvider" AS ENUM ('GITHUB', 'LEETCODE');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'DISABLED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "preferredLanguage" "Language" NOT NULL DEFAULT 'JAVASCRIPT',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devices" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "platform" "Platform" NOT NULL,
    "label" TEXT NOT NULL,
    "pushToken" TEXT,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timer_configs" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "durationMinutes" INTEGER NOT NULL DEFAULT 60,
    "graceSeconds" INTEGER NOT NULL DEFAULT 60,
    "activeDaysMask" INTEGER NOT NULL DEFAULT 127,
    "activeFromMinute" INTEGER NOT NULL DEFAULT 0,
    "activeToMinute" INTEGER NOT NULL DEFAULT 1440,
    "dailySkipAllowance" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "timer_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "problems" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "promptMarkdown" TEXT NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "starterCode" JSONB NOT NULL,
    "driverCode" JSONB NOT NULL,
    "referenceRuntimeMs" JSONB NOT NULL,
    "bestRuntimeMs" JSONB NOT NULL DEFAULT '{}',
    "cpuTimeLimit" DOUBLE PRECISION NOT NULL DEFAULT 2.0,
    "memoryLimitKb" INTEGER NOT NULL DEFAULT 128000,
    "avgSolveSeconds" INTEGER NOT NULL DEFAULT 600,
    "solveCount" INTEGER NOT NULL DEFAULT 0,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "leetcodeSlug" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "problems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_cases" (
    "id" UUID NOT NULL,
    "problemId" UUID NOT NULL,
    "ordinal" INTEGER NOT NULL,
    "stdin" TEXT NOT NULL,
    "expectedStdout" TEXT NOT NULL,
    "isSample" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "test_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_progress" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "currentDifficulty" "Difficulty" NOT NULL DEFAULT 'EASY',
    "consecutiveFastSolves" INTEGER NOT NULL DEFAULT 0,
    "consecutiveFailures" INTEGER NOT NULL DEFAULT 0,
    "totalSolved" INTEGER NOT NULL DEFAULT 0,
    "totalFailed" INTEGER NOT NULL DEFAULT 0,
    "emaSolveSeconds" INTEGER NOT NULL DEFAULT 600,
    "firstTryRate" INTEGER NOT NULL DEFAULT 500,
    "lastPromotedAt" TIMESTAMP(3),
    "lastDemotedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lock_sessions" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "deviceId" UUID,
    "problemId" UUID,
    "state" "LockState" NOT NULL DEFAULT 'ARMED',
    "difficulty" "Difficulty" NOT NULL DEFAULT 'EASY',
    "armedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fireAt" TIMESTAMP(3) NOT NULL,
    "lockedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "escapeReason" TEXT,
    "unlockTokenHash" TEXT,

    CONSTRAINT "lock_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submissions" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "problemId" UUID NOT NULL,
    "lockSessionId" UUID,
    "language" "Language" NOT NULL,
    "sourceCode" TEXT NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'QUEUED',
    "passedCount" INTEGER NOT NULL DEFAULT 0,
    "totalCount" INTEGER NOT NULL DEFAULT 0,
    "runtimeMs" INTEGER,
    "memoryKb" INTEGER,
    "gateMs" INTEGER,
    "message" TEXT,
    "judgeTokens" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "elapsedSeconds" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integrations" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "provider" "IntegrationProvider" NOT NULL,
    "externalUsername" TEXT NOT NULL,
    "accessTokenCipher" TEXT,
    "scopes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "repoFullName" TEXT,
    "repoBranch" TEXT NOT NULL DEFAULT 'main',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cachedStats" JSONB,

    CONSTRAINT "integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_records" (
    "id" UUID NOT NULL,
    "integrationId" UUID NOT NULL,
    "submissionId" UUID NOT NULL,
    "status" "SyncStatus" NOT NULL DEFAULT 'PENDING',
    "detail" TEXT,
    "externalUrl" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sync_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_tokenHash_key" ON "refresh_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE INDEX "devices_userId_idx" ON "devices"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "timer_configs_userId_key" ON "timer_configs"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "problems_slug_key" ON "problems"("slug");

-- CreateIndex
CREATE INDEX "problems_difficulty_isActive_idx" ON "problems"("difficulty", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "test_cases_problemId_ordinal_key" ON "test_cases"("problemId", "ordinal");

-- CreateIndex
CREATE UNIQUE INDEX "user_progress_userId_key" ON "user_progress"("userId");

-- CreateIndex
CREATE INDEX "lock_sessions_userId_state_idx" ON "lock_sessions"("userId", "state");

-- CreateIndex
CREATE INDEX "lock_sessions_state_fireAt_idx" ON "lock_sessions"("state", "fireAt");

-- CreateIndex
CREATE INDEX "submissions_userId_createdAt_idx" ON "submissions"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "submissions_lockSessionId_idx" ON "submissions"("lockSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "integrations_userId_provider_key" ON "integrations"("userId", "provider");

-- CreateIndex
CREATE INDEX "sync_records_status_idx" ON "sync_records"("status");

-- CreateIndex
CREATE UNIQUE INDEX "sync_records_integrationId_submissionId_key" ON "sync_records"("integrationId", "submissionId");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timer_configs" ADD CONSTRAINT "timer_configs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_cases" ADD CONSTRAINT "test_cases_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lock_sessions" ADD CONSTRAINT "lock_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lock_sessions" ADD CONSTRAINT "lock_sessions_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lock_sessions" ADD CONSTRAINT "lock_sessions_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "problems"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_lockSessionId_fkey" FOREIGN KEY ("lockSessionId") REFERENCES "lock_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_records" ADD CONSTRAINT "sync_records_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "integrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_records" ADD CONSTRAINT "sync_records_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

