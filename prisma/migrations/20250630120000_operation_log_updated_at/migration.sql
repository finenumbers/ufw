-- Add updatedAt for activity-based stale operation sweeps
ALTER TABLE "operation_log" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Global operations history listing
CREATE INDEX "operation_log_createdAt_idx" ON "operation_log"("createdAt" DESC);
