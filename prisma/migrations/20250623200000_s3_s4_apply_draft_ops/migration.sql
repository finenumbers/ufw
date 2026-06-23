-- AlterEnum
ALTER TYPE "OperationStatus" ADD VALUE 'PARTIAL';

-- AlterTable
ALTER TABLE "apply_session" ADD COLUMN "desiredJson" JSONB;

-- AlterTable
ALTER TABLE "draft_session" ADD COLUMN "savedAt" TIMESTAMP(3);
