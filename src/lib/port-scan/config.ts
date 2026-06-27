import { OPERATION_REPEAT_LIMIT_MS } from "@/lib/operation-rate-limit";

function readInt(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export function isPortScanEnabled(): boolean {
  const raw = process.env.PORT_SCAN_ENABLED?.trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes";
}

export function getPortScanMaxNmapPorts(): number {
  return readInt("PORT_SCAN_MAX_NMAP_PORTS", 500);
}

export function getPortScanNaabuTimeoutMs(): number {
  return readInt("PORT_SCAN_NAABU_TIMEOUT_MS", 1_800_000);
}

export function getPortScanNmapTimeoutMs(): number {
  return readInt("PORT_SCAN_NMAP_TIMEOUT_MS", 600_000);
}

export function getPortScanHistoryLimit(): number {
  return readInt("PORT_SCAN_HISTORY_LIMIT", 10);
}

export function getPortScanRateLimitWindowMs(): number {
  return readInt("PORT_SCAN_RATE_LIMIT_WINDOW_MS", OPERATION_REPEAT_LIMIT_MS);
}

export function resolveNaabuPortArg(): string[] {
  return ["-p", "-"];
}
