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

export function getDockerRefreshRateLimitWindowMs(): number {
  return readInt("DOCKER_REFRESH_RATE_LIMIT_WINDOW_MS", 120_000);
}

export function getDockerControlRateLimitWindowMs(): number {
  return readInt("DOCKER_CONTROL_RATE_LIMIT_WINDOW_MS", 300_000);
}

export function getDockerCommandTimeoutMs(): number {
  return readInt("DOCKER_COMMAND_TIMEOUT_MS", 60_000);
}
