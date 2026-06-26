import type { NaabuDiscoveryRow } from "@/types/port-scan";

function normalizeProtocol(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) {
    return "tcp";
  }
  return value.trim().toLowerCase();
}

function parseNaabuObject(raw: Record<string, unknown>): NaabuDiscoveryRow | null {
  const portRaw = raw.port ?? raw.Port;
  const port = typeof portRaw === "number" ? portRaw : Number.parseInt(String(portRaw), 10);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    return null;
  }

  const host =
    typeof raw.host === "string"
      ? raw.host
      : typeof raw.ip === "string"
        ? raw.ip
        : "unknown";

  return {
    host,
    port,
    protocol: normalizeProtocol(raw.protocol ?? raw.Protocol),
    state: "open",
    raw,
  };
}

export function parseNaabuJsonOutput(output: string): NaabuDiscoveryRow[] {
  const rows: NaabuDiscoveryRow[] = [];
  const seen = new Set<string>();

  for (const line of output.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("{")) {
      continue;
    }

    try {
      const parsed = JSON.parse(trimmed) as Record<string, unknown>;
      const row = parseNaabuObject(parsed);
      if (!row) continue;

      const key = `${row.port}/${row.protocol}`;
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push(row);
    } catch {
      continue;
    }
  }

  return rows.sort((left, right) => left.port - right.port);
}
