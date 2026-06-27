import { readBoolEnv, readIntEnv } from "@/lib/env-read";

export function isDockerMonitorEnabled(): boolean {
  return readBoolEnv("DOCKER_MONITOR_ENABLED");
}

export function getDockerInventoryHistoryLimit(): number {
  return readIntEnv("DOCKER_INVENTORY_HISTORY_LIMIT", 10);
}
