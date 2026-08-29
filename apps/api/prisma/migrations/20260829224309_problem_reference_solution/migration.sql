-- AlterTable
ALTER TABLE "problems" ADD COLUMN     "referenceSolution" JSONB NOT NULL DEFAULT '{}';
