import { db } from "@/lib/db";

export type ServerInventoryStats = {
  ufwRuleCount: number;
  portFindingCount: number;
  containerCount: number;
};

const emptyStats: ServerInventoryStats = {
  ufwRuleCount: 0,
  portFindingCount: 0,
  containerCount: 0,
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
      _count: { select: { findings: true } },
    },
  });

  return new Map(scans.map((scan) => [scan.serverId, scan._count.findings]));
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

export async function getServerInventoryStats(serverId: string): Promise<ServerInventoryStats> {
  const stats = await getServerInventoryStatsMap([serverId]);
  return stats.get(serverId) ?? emptyStats;
}
