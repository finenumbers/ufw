function readInt(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export function isDockerMonitorEnabled(): boolean {
  const raw = process.env.DOCKER_MONITOR_ENABLED?.trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes";
}

export function getDockerInventoryHistoryLimit(): number {
  return readInt("DOCKER_INVENTORY_HISTORY_LIMIT", 10);
}
