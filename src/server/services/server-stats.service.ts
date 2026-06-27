import { db } from "@/lib/db";

export type ServerInventoryStats = {
  ufwRuleCount: number;
  portFindingCount: number;
  containerCount: number;
};

async function loadPortFindingCounts(serverIds: string[]): Promise<Map<string, number>> {
  if (serverIds.length === 0) {
    return new Map();
  }

  const scans = await db.portScan.findMany({
    where: { serverId: { in: serverIds }, status: "SUCCESS" },
    orderBy: { startedAt: "desc" },
    distinct: ["serverId"],
    select: {
      serverId: true,
      summaryJson: true,
    },
  });

  return new Map(
    scans.map((scan) => {
      const summary = scan.summaryJson as { openCount?: number } | null;
      return [scan.serverId, summary?.openCount ?? 0];
    }),
  );
}

async function loadContainerCounts(serverIds: string[]): Promise<Map<string, number>> {
  if (serverIds.length === 0) {
    return new Map();
  }

  const snapshots = await db.dockerInventorySnapshot.findMany({
    where: { serverId: { in: serverIds }, status: "SUCCESS" },
    orderBy: { capturedAt: "desc" },
    distinct: ["serverId"],
    select: {
      serverId: true,
      containerCount: true,
    },
  });

  return new Map(snapshots.map((snapshot) => [snapshot.serverId, snapshot.containerCount]));
}

async function loadUfwRuleCounts(serverIds: string[]): Promise<Map<string, number>> {
  if (serverIds.length === 0) {
    return new Map();
  }

  const counts = await db.ruleRecord.groupBy({
    by: ["serverId"],
    where: { serverId: { in: serverIds } },
    _count: { id: true },
  });

  return new Map(counts.map((entry) => [entry.serverId, entry._count.id]));
}

export function mergeServerInventoryStats(
  serverId: string,
  ufwCounts: Map<string, number>,
  portCounts: Map<string, number>,
  containerCounts: Map<string, number>,
): ServerInventoryStats {
  return {
    ufwRuleCount: ufwCounts.get(serverId) ?? 0,
    portFindingCount: portCounts.get(serverId) ?? 0,
    containerCount: containerCounts.get(serverId) ?? 0,
  };
}

export async function getServerInventoryStatsMap(
  serverIds: string[],
): Promise<Map<string, ServerInventoryStats>> {
  const [ufwCounts, portCounts, containerCounts] = await Promise.all([
    loadUfwRuleCounts(serverIds),
    loadPortFindingCounts(serverIds),
    loadContainerCounts(serverIds),
  ]);

  return new Map(
    serverIds.map((serverId) => [
      serverId,
      mergeServerInventoryStats(serverId, ufwCounts, portCounts, containerCounts),
    ]),
  );
}
