-- AlterTable
ALTER TABLE "problems" ADD COLUMN     "popularity" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "popularityCheckedAt" TIMESTAMP(3),
ADD COLUMN     "popularitySource" TEXT;
