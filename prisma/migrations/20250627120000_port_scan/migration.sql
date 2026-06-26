-- CreateEnum
CREATE TYPE "PortScanPerspective" AS ENUM ('EXTERNAL');

-- CreateEnum
CREATE TYPE "PortScanProfile" AS ENUM ('TOP1000', 'FULL');

-- CreateEnum
CREATE TYPE "PortScanFindingSource" AS ENUM ('NAABU', 'NMAP');

-- CreateEnum
CREATE TYPE "PortScanEnrichmentStatus" AS ENUM ('PENDING', 'ENRICHED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "UfwCoverage" AS ENUM ('ALLOWED', 'NOT_IN_UFW', 'DENIED', 'UNKNOWN');

-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'PORT_SCAN_STARTED';
ALTER TYPE "AuditAction" ADD VALUE 'PORT_SCAN_COMPLETED';

-- CreateTable
CREATE TABLE "port_scan" (
    "id" TEXT NOT NULL,
    "serverId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "OperationStatus" NOT NULL DEFAULT 'PENDING',
    "perspective" "PortScanPerspective" NOT NULL DEFAULT 'EXTERNAL',
    "targetHost" TEXT NOT NULL,
    "targetIp" TEXT,
    "profile" "PortScanProfile" NOT NULL DEFAULT 'TOP1000',
    "summaryJson" JSONB,
    "errorMessage" TEXT,
    "operationLogId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "port_scan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "port_scan_finding" (
    "id" TEXT NOT NULL,
    "scanId" TEXT NOT NULL,
    "port" INTEGER NOT NULL,
    "protocol" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "serviceName" TEXT,
    "product" TEXT,
    "version" TEXT,
    "banner" TEXT,
    "cpe" TEXT,
    "source" "PortScanFindingSource" NOT NULL,
    "enrichmentStatus" "PortScanEnrichmentStatus" NOT NULL DEFAULT 'PENDING',
    "ufwCoverage" "UfwCoverage",
    "rawJson" JSONB,

    CONSTRAINT "port_scan_finding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "port_scan_serverId_startedAt_idx" ON "port_scan"("serverId", "startedAt" DESC);

-- CreateIndex
CREATE INDEX "port_scan_finding_scanId_port_idx" ON "port_scan_finding"("scanId", "port");

-- CreateIndex
CREATE UNIQUE INDEX "port_scan_finding_scanId_port_protocol_key" ON "port_scan_finding"("scanId", "port", "protocol");

-- AddForeignKey
ALTER TABLE "port_scan" ADD CONSTRAINT "port_scan_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "server"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "port_scan_finding" ADD CONSTRAINT "port_scan_finding_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "port_scan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
