import { readBoolEnv, readIntEnv } from "@/lib/env-read";

export function isPortScanEnabled(): boolean {
  return readBoolEnv("PORT_SCAN_ENABLED");
}

export function getPortScanMaxNmapPorts(): number {
  return readIntEnv("PORT_SCAN_MAX_NMAP_PORTS", 500);
}

export function getPortScanNaabuTimeoutMs(): number {
  return readIntEnv("PORT_SCAN_NAABU_TIMEOUT_MS", 1_800_000);
}

export function getPortScanNmapTimeoutMs(): number {
  return readIntEnv("PORT_SCAN_NMAP_TIMEOUT_MS", 600_000);
}

export function getPortScanHistoryLimit(): number {
  return readIntEnv("PORT_SCAN_HISTORY_LIMIT", 10);
}

export function resolveNaabuPortArg(): string[] {
  return ["-p", "-"];
}
