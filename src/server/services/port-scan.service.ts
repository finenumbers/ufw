import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { getPortScanHistoryLimit } from "@/lib/port-scan/config";
import { buildCoverageMap } from "@/lib/port-scan/coverage";
import { mergeDiscoveryAndEnrichment, summarizeFindings } from "@/lib/port-scan/normalize";
import { resolveScanTarget } from "@/lib/port-scan/target";
import { runNaabuDiscovery, runNmapEnrichment } from "@/lib/port-scan/workers";
import type { PortScanFindingView, PortScanSummary, PortScanView } from "@/types/port-scan";
import { createAuditEvent } from "@/server/services/audit.service";
import {
  semanticStep,
  startOperation,
  type OperationTracker,
} from "@/server/services/operation-progress.service";
import { loadLatestSnapshot } from "@/server/services/snapshot.service";

export const PORT_SCAN_IN_PROGRESS = "scan_in_progress";

function toFindingView(row: {
  id: string;
  port: number;
  protocol: string;
  state: string;
  serviceName: string | null;
  product: string | null;
  version: string | null;
  banner: string | null;
  cpe: string | null;
  source: PortScanFindingView["source"];
  enrichmentStatus: PortScanFindingView["enrichmentStatus"];
  ufwCoverage: PortScanFindingView["ufwCoverage"];
}): PortScanFindingView {
  const displayParts = [row.product ?? row.serviceName, row.version].filter(Boolean);
  return {
    ...row,
    displayLabel: displayParts.length > 0 ? displayParts.join(" ") : row.serviceName,
  };
}

function toPortScanView(scan: {
  id: string;
  serverId: string;
  status: PortScanView["status"];
  perspective: PortScanView["perspective"];
  targetHost: string;
  targetIp: string | null;
  profile: PortScanView["profile"];
  summaryJson: Prisma.JsonValue | null;
  errorMessage: string | null;
  startedAt: Date;
  completedAt: Date | null;
  findings: Array<Parameters<typeof toFindingView>[0]>;
}): PortScanView {
  return {
    id: scan.id,
    serverId: scan.serverId,
    status: scan.status,
    perspective: scan.perspective,
    targetHost: scan.targetHost,
    targetIp: scan.targetIp,
    profile: scan.profile,
    summary: (scan.summaryJson as PortScanSummary | null) ?? null,
    errorMessage: scan.errorMessage,
    startedAt: scan.startedAt.toISOString(),
    completedAt: scan.completedAt?.toISOString() ?? null,
    findings: scan.findings.map(toFindingView),
  };
}

async function trimScanHistory(serverId: string): Promise<void> {
  const limit = getPortScanHistoryLimit();
  const scans = await db.portScan.findMany({
    where: { serverId },
    orderBy: { startedAt: "desc" },
    select: { id: true },
    skip: limit,
  });

  if (scans.length === 0) {
    return;
  }

  await db.portScan.deleteMany({
    where: { id: { in: scans.map((scan) => scan.id) } },
  });
}

export async function replacePortScanFindings(
  scanId: string,
  findings: ReturnType<typeof mergeDiscoveryAndEnrichment>,
  client: Pick<typeof db, "$transaction" | "portScanFinding"> = db,
): Promise<void> {
  const data = findings.map((row) => ({
    scanId,
    port: row.port,
    protocol: row.protocol,
    state: row.state,
    serviceName: row.serviceName,
    product: row.product,
    version: row.version,
    banner: row.banner,
    cpe: row.cpe,
    source: row.source,
    enrichmentStatus: row.enrichmentStatus,
    ufwCoverage: row.ufwCoverage,
    rawJson: row.rawJson as Prisma.InputJsonValue,
  }));

  await client.$transaction([
    client.portScanFinding.deleteMany({ where: { scanId } }),
    ...(findings.length > 0 ? [client.portScanFinding.createMany({ data })] : []),
  ]);
}

async function findLatestPortScan(
  serverId: string,
  status?: PortScanView["status"],
): Promise<PortScanView | null> {
  const scan = await db.portScan.findFirst({
    where: { serverId, ...(status ? { status } : {}) },
    orderBy: { startedAt: "desc" },
    include: {
      findings: {
        orderBy: [{ port: "asc" }, { protocol: "asc" }],
      },
    },
  });

  return scan ? toPortScanView(scan) : null;
}

export async function getLatestPortScan(serverId: string): Promise<PortScanView | null> {
  return findLatestPortScan(serverId);
}

export async function getPortScanById(scanId: string): Promise<PortScanView | null> {
  const scan = await db.portScan.findUnique({
    where: { id: scanId },
    include: {
      findings: {
        orderBy: [{ port: "asc" }, { protocol: "asc" }],
      },
    },
  });

  return scan ? toPortScanView(scan) : null;
}

export async function getPortScanStatusById(scanId: string): Promise<PortScanView | null> {
  const scan = await db.portScan.findUnique({
    where: { id: scanId },
    select: {
      id: true,
      serverId: true,
      status: true,
      perspective: true,
      targetHost: true,
      targetIp: true,
      profile: true,
      summaryJson: true,
      errorMessage: true,
      startedAt: true,
      completedAt: true,
    },
  });

  if (!scan) {
    return null;
  }

  return {
    id: scan.id,
    serverId: scan.serverId,
    status: scan.status,
    perspective: scan.perspective,
    targetHost: scan.targetHost,
    targetIp: scan.targetIp,
    profile: scan.profile,
    summary: (scan.summaryJson as PortScanSummary | null) ?? null,
    errorMessage: scan.errorMessage,
    startedAt: scan.startedAt.toISOString(),
    completedAt: scan.completedAt?.toISOString() ?? null,
    findings: [],
  };
}

async function createPortScanJob(params: {
  serverId: string;
  userId: string;
  targetHost: string;
  operationLogId: string;
}): Promise<{ scanId: string }> {
  const scan = await db.portScan.create({
    data: {
      serverId: params.serverId,
      userId: params.userId,
      profile: "FULL",
      targetHost: params.targetHost,
      perspective: "EXTERNAL",
      status: "PENDING",
      operationLogId: params.operationLogId,
    },
  });

  return { scanId: scan.id };
}

async function runPortScanPipeline(scanId: string, tracker: OperationTracker): Promise<void> {
  const scan = await db.portScan.findUnique({
    where: { id: scanId },
    include: { server: true },
  });

  if (!scan) {
    throw new Error("Port scan not found");
  }

  try {
    await tracker.markRunning();
    await tracker.startStep("resolve_target", semanticStep("resolve_target", "steps.port_scan_resolve"));

    const resolved = await resolveScanTarget(scan.server.host);
    if (resolved.host !== scan.targetHost) {
      throw new Error("Scan target mismatch");
    }

    const scanAddress = resolved.ip;

    await db.portScan.update({
      where: { id: scanId },
      data: {
        status: "RUNNING",
        targetIp: resolved.ip,
      },
    });

    await tracker.completeStep("resolve_target");
    await tracker.startStep("discovery", semanticStep("discovery", "steps.port_scan_discovery"));
    await tracker.setProgress(1, 4, { key: "messages.port_scan_discovery" });

    const discovery = await runNaabuDiscovery(scanAddress);

    await tracker.completeStep("discovery");
    await tracker.startStep("enrichment", semanticStep("enrichment", "steps.port_scan_enrichment"));
    await tracker.setProgress(2, 4, { key: "messages.port_scan_enrichment" });

    const enrichment = await runNmapEnrichment(scanAddress, discovery.rows);

    await tracker.completeStep("enrichment");
    await tracker.startStep("normalize", semanticStep("normalize", "steps.port_scan_normalize"));
    await tracker.setProgress(3, 4, { key: "messages.port_scan_normalize" });

    const snapshot = await loadLatestSnapshot(scan.serverId);
    const coverageRules =
      snapshot?.rules.map((rule) => ({
        action: rule.action,
        direction: rule.direction,
        protocol: rule.protocol,
        fromAddress: rule.fromAddress,
        toPort: rule.toPort,
        fromPort: rule.fromPort,
      })) ?? [];

    const coverageMap = buildCoverageMap(
      discovery.rows.map((row) => ({ port: row.port, protocol: row.protocol })),
      coverageRules,
      { ufwActive: snapshot?.ufwActive },
    );

    const normalized = mergeDiscoveryAndEnrichment(
      discovery.rows,
      enrichment.rows,
      coverageMap,
    );
    const summary = summarizeFindings(normalized);

    await replacePortScanFindings(scanId, normalized);
    await trimScanHistory(scan.serverId);

    await db.portScan.update({
      where: { id: scanId },
      data: {
        status: "SUCCESS",
        summaryJson: summary as Prisma.InputJsonValue,
        completedAt: new Date(),
      },
    });

    await tracker.completeStep("normalize");
    await tracker.setProgress(4, 4);
    await tracker.complete(
      { key: "messages.port_scan_complete", params: { count: String(summary.openCount) } },
      summary,
    );

    await createAuditEvent({
      userId: scan.userId,
      action: "PORT_SCAN_COMPLETED",
      entityType: "server",
      entityId: scan.serverId,
      metadata: { scanId, ...summary },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Port scan failed";

    await db.portScan.update({
      where: { id: scanId },
      data: {
        status: "FAILED",
        errorMessage: message,
        completedAt: new Date(),
      },
    });

    await tracker.fail(
      { key: "messages.port_scan_failed", params: { error: message } },
      [message],
    );
  }
}

export async function startPortScan(params: {
  serverId: string;
  userId: string;
}): Promise<{ scanId: string; operationId: string }> {
  const server = await db.server.findUnique({ where: { id: params.serverId } });
  if (!server) {
    throw new Error("Server not found");
  }

  const activeScan = await db.portScan.findFirst({
    where: {
      serverId: server.id,
      status: { in: ["PENDING", "RUNNING"] },
    },
    select: { id: true },
  });

  if (activeScan) {
    throw new Error(PORT_SCAN_IN_PROGRESS);
  }

  const tracker = await startOperation({
    serverId: server.id,
    userId: params.userId,
    type: "port.scan",
    messageI18n: { key: "messages.port_scan_start" },
    steps: [
      semanticStep("resolve_target", "steps.port_scan_resolve"),
      semanticStep("discovery", "steps.port_scan_discovery"),
      semanticStep("enrichment", "steps.port_scan_enrichment"),
      semanticStep("normalize", "steps.port_scan_normalize"),
    ],
  });

  const { scanId } = await createPortScanJob({
    serverId: server.id,
    userId: params.userId,
    targetHost: server.host,
    operationLogId: tracker.operationId,
  });

  await createAuditEvent({
    userId: params.userId,
    action: "PORT_SCAN_STARTED",
    entityType: "server",
    entityId: server.id,
    metadata: { scanId, profile: "FULL", targetHost: server.host },
  });

  void runPortScanPipeline(scanId, tracker);

  return { scanId, operationId: tracker.operationId };
}
