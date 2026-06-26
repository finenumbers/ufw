export type DockerStatsRow = {
  containerId: string;
  name: string;
  cpuPercent: number | null;
  memUsageBytes: bigint | null;
  memLimitBytes: bigint | null;
  memUsageLabel: string | null;
};

const BYTE_UNITS: Record<string, bigint> = {
  b: 1n,
  kib: 1024n,
  mib: 1024n ** 2n,
  gib: 1024n ** 3n,
  tib: 1024n ** 4n,
  kb: 1000n,
  mb: 1000n ** 2n,
  gb: 1000n ** 3n,
};

function parseByteSize(raw: string): bigint | null {
  const match = raw.trim().match(/^([\d.]+)\s*([a-z]+)$/i);
  if (!match) return null;

  const value = Number.parseFloat(match[1]);
  if (!Number.isFinite(value)) return null;

  const unit = BYTE_UNITS[match[2].toLowerCase()];
  if (!unit) return null;

  return BigInt(Math.round(value * Number(unit)));
}

function parseCpuPercent(raw: unknown): number | null {
  if (typeof raw !== "string") return null;
  const value = Number.parseFloat(raw.replace("%", "").trim());
  return Number.isFinite(value) ? value : null;
}

function parseMemUsage(raw: unknown): {
  usage: bigint | null;
  limit: bigint | null;
  label: string | null;
} {
  if (typeof raw !== "string" || !raw.includes("/")) {
    return { usage: null, limit: null, label: null };
  }

  const [usageRaw, limitRaw] = raw.split("/").map((part) => part.trim());
  return {
    usage: parseByteSize(usageRaw),
    limit: parseByteSize(limitRaw),
    label: raw.trim(),
  };
}

function normalizeStatsContainerId(raw: unknown): string {
  if (typeof raw !== "string" || !raw.trim()) return "";
  return raw.slice(0, 12);
}

export function parseDockerStatsOutput(output: string): DockerStatsRow[] {
  const rows: DockerStatsRow[] = [];

  for (const line of output.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(trimmed) as Record<string, unknown>;
    } catch {
      continue;
    }

    const containerId = normalizeStatsContainerId(parsed.ID ?? parsed.Container);
    if (!containerId) continue;

    const mem = parseMemUsage(parsed.MemUsage);
    rows.push({
      containerId,
      name: typeof parsed.Name === "string" ? parsed.Name.replace(/^\//, "") : "",
      cpuPercent: parseCpuPercent(parsed.CPUPerc),
      memUsageBytes: mem.usage,
      memLimitBytes: mem.limit,
      memUsageLabel: mem.label,
    });
  }

  return rows;
}
