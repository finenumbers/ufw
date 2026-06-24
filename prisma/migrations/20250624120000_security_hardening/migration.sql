-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'CONFIG_EXPORT';
ALTER TYPE "AuditAction" ADD VALUE 'OPERATIONS_CLEARED';

-- AlterTable
ALTER TABLE "server" ADD COLUMN "sshHostKeyVerified" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "operation_log_status_idx" ON "operation_log"("status");
