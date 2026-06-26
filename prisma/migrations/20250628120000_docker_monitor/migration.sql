-- Docker container monitor (remote SSH inventory)
ALTER TYPE "AuditAction" ADD VALUE 'DOCKER_INVENTORY_REFRESHED';
ALTER TYPE "AuditAction" ADD VALUE 'DOCKER_CONTAINER_STARTED';
ALTER TYPE "AuditAction" ADD VALUE 'DOCKER_CONTAINER_STOPPED';
ALTER TYPE "AuditAction" ADD VALUE 'DOCKER_CONTAINER_RESTARTED';

CREATE TABLE "docker_inventory_snapshot" (
    "id" TEXT NOT NULL,
    "serverId" TEXT NOT NULL,
    "userId" TEXT,
    "status" "OperationStatus" NOT NULL DEFAULT 'PENDING',
    "dockerInstalled" BOOLEAN NOT NULL DEFAULT false,
    "dockerReachable" BOOLEAN NOT NULL DEFAULT false,
    "dockerVersion" TEXT,
    "composeVersion" TEXT,
    "containerCount" INTEGER NOT NULL DEFAULT 0,
    "runningCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "operationLogId" TEXT,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "docker_inventory_snapshot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "docker_container_record" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "containerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "health" TEXT,
    "stateExitCode" INTEGER,
    "restartCount" INTEGER,
    "publishedPorts" JSONB,
    "composeProject" TEXT,
    "composeService" TEXT,
    "cpuPercent" DOUBLE PRECISION,
    "memUsageBytes" BIGINT,
    "memLimitBytes" BIGINT,
    "startedAt" TIMESTAMP(3),
    "createdAtRemote" TIMESTAMP(3),
    "rawInspectJson" JSONB,

    CONSTRAINT "docker_container_record_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "docker_inventory_snapshot_serverId_capturedAt_idx" ON "docker_inventory_snapshot"("serverId", "capturedAt" DESC);

CREATE INDEX "docker_container_record_snapshotId_name_idx" ON "docker_container_record"("snapshotId", "name");

CREATE UNIQUE INDEX "docker_container_record_snapshotId_containerId_key" ON "docker_container_record"("snapshotId", "containerId");

ALTER TABLE "docker_inventory_snapshot" ADD CONSTRAINT "docker_inventory_snapshot_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "server"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "docker_container_record" ADD CONSTRAINT "docker_container_record_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "docker_inventory_snapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
