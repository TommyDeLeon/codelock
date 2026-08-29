-- CreateEnum
CREATE TYPE "Tier" AS ENUM ('TIER_0', 'TIER_0_5', 'TIER_1', 'TIER_2', 'TIER_3');

-- CreateEnum
CREATE TYPE "PatternFamily" AS ENUM ('ARRAYS_HASHING', 'TWO_POINTERS', 'SLIDING_WINDOW', 'STACK', 'BINARY_SEARCH', 'LINKED_LIST', 'TREES', 'TRIES', 'HEAP_PRIORITY_QUEUE', 'BACKTRACKING', 'GRAPHS', 'ADVANCED_GRAPHS', 'DP_1D', 'DP_2D', 'GREEDY', 'INTERVALS', 'MATH_GEOMETRY', 'BIT_MANIPULATION', 'FOUNDATIONS', 'DATA_STRUCTURES');

-- AlterTable
ALTER TABLE "problems" ADD COLUMN     "answerLookupRisk" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "attributionText" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "editorialMarkdown" TEXT,
ADD COLUMN     "editorialUrl" TEXT,
ADD COLUMN     "eligibleForUnlock" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "explanationQuality" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "interviewFrequency" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "judgeability" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "lockWindowFit" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "patternFamily" "PatternFamily" NOT NULL DEFAULT 'FOUNDATIONS',
ADD COLUMN     "patternTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "patternTransfer" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "signatureId" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'codelock-authored',
ADD COLUMN     "sourceLicense" TEXT NOT NULL DEFAULT 'CC0-1.0',
ADD COLUMN     "sourceRef" TEXT NOT NULL DEFAULT 'codelock-authored',
ADD COLUMN     "sourceUrl" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "tier" "Tier" NOT NULL DEFAULT 'TIER_1',
ADD COLUMN     "valueScore" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "problems_tier_isActive_idx" ON "problems"("tier", "isActive");

-- CreateIndex
CREATE INDEX "problems_patternFamily_tier_idx" ON "problems"("patternFamily", "tier");
