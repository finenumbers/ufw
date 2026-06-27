-- Composite indexes for list/detail hot queries
CREATE INDEX "port_scan_serverId_status_startedAt_idx" ON "port_scan"("serverId", "status", "startedAt" DESC);

CREATE INDEX "docker_inventory_snapshot_serverId_status_capturedAt_idx" ON "docker_inventory_snapshot"("serverId", "status", "capturedAt" DESC);

CREATE INDEX "operation_log_serverId_status_createdAt_idx" ON "operation_log"("serverId", "status", "createdAt" DESC);
