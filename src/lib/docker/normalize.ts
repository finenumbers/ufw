import type { DockerPsRow } from "@/lib/docker/ps-parser";
import type { DockerStatsRow } from "@/lib/docker/stats-parser";
import type { NormalizedDockerContainer } from "@/types/docker-monitor";

function extractHealth(status: string): string | null {
  const match = status.match(/\((healthy|unhealthy|starting)\)/i);
  return match ? match[1].toLowerCase() : null;
}

export function mergePsAndStats(
  psRows: DockerPsRow[],
  statsRows: DockerStatsRow[],
): NormalizedDockerContainer[] {
  const statsMap = new Map(statsRows.map((row) => [row.containerId, row]));

  return psRows.map((row) => {
    const stats = statsMap.get(row.containerId);
    return {
      containerId: row.containerId,
      name: row.name || row.containerId,
      image: row.image,
      status: row.status,
      health: extractHealth(row.status),
      stateExitCode: null,
      restartCount: null,
      publishedPorts: row.publishedPorts,
      composeProject: row.composeProject,
      composeService: row.composeService,
      cpuPercent: stats?.cpuPercent ?? null,
      memUsageBytes: stats?.memUsageBytes ?? null,
      memLimitBytes: stats?.memLimitBytes ?? null,
      memUsageLabel: stats?.memUsageLabel ?? null,
      startedAt: null,
      createdAtRemote: row.createdAtRemote,
    };
  });
}

export function summarizeInventory(containers: NormalizedDockerContainer[]): {
  containerCount: number;
  runningCount: number;
  stoppedCount: number;
} {
  const runningCount = containers.filter((row) => row.status.toLowerCase().includes("up")).length;
  return {
    containerCount: containers.length,
    runningCount,
    stoppedCount: containers.length - runningCount,
  };
}
