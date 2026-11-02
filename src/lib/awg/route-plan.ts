import { canonicalIpv4 } from "@/lib/awg/policy";

export type AwgRouteRecord = {
  ip: string;
  host: string;
};

export type AwgRouteAvailability = "ready" | "tunnel-down" | "other-instance" | "helper-error";

export type AwgRoutedServerRow = {
  id: string;
  name: string;
  host: string;
  port: number;
  ip: string | null;
  installed: boolean;
  sameHost: { id: string; name: string }[];
  sharesIpWith: { id: string; name: string }[];
};

export type AwgRouteSnapshot = {
  availability: AwgRouteAvailability;
  canRemove: boolean;
  servers: AwgRoutedServerRow[];
  orphans: { ip: string }[];
};

export type HostRemovalDecision =
  | { kind: "abort" }
  | { kind: "apply"; ip: string; deleteIp: string | null; routeKept: boolean };

type ServerIdentity = {
  id: string;
  name: string;
  host: string;
  port: number;
};

function hostKey(host: string): string {
  return host.trim().toLowerCase();
}

function dedupeRecords(records: AwgRouteRecord[]): AwgRouteRecord[] {
  const hosts = new Set<string>();
  const bareIps = new Set<string>();
  const next: AwgRouteRecord[] = [];
  for (const record of records) {
    if (record.host) {
      const key = hostKey(record.host);
      if (hosts.has(key)) continue;
      hosts.add(key);
      next.push(record);
      continue;
    }
    if (bareIps.has(record.ip)) continue;
    bareIps.add(record.ip);
    next.push(record);
  }
  return next;
}

export function normalizeRouteRecords(value: unknown): AwgRouteRecord[] {
  if (!Array.isArray(value)) return [];
  const records: AwgRouteRecord[] = [];
  for (const row of value) {
    if (!row || typeof row !== "object") continue;
    const raw = row as { ip?: unknown; host?: unknown };
    const ip = canonicalIpv4(String(raw.ip ?? ""));
    const host = String(raw.host ?? "").trim();
    if (!ip) continue;
    if (host && (host.length > 253 || /\s/.test(host))) continue;
    records.push({ ip, host });
  }
  return dedupeRecords(records);
}

/** Host routes from `ip -json route show`: a bare dst is /32. */
export function parseKernelRoutes(dump: unknown): string[] {
  if (!Array.isArray(dump)) return [];
  const ips: string[] = [];
  for (const row of dump) {
    if (!row || typeof row !== "object") continue;
    const dst = (row as { dst?: unknown }).dst;
    if (typeof dst !== "string" || dst === "default" || dst.includes(":")) continue;
    const slash = dst.indexOf("/");
    const address = slash === -1 ? dst : dst.slice(0, slash);
    const prefix = slash === -1 ? null : dst.slice(slash + 1);
    if (prefix !== null && prefix !== "32") continue;
    const ip = canonicalIpv4(address);
    if (ip) ips.push(ip);
  }
  return [...new Set(ips)];
}

function kernelSet(ips: readonly string[]): Set<string> {
  return new Set(
    ips.flatMap((ip) => {
      const canonical = canonicalIpv4(ip);
      return canonical ? [canonical] : [];
    }),
  );
}

function recordForHost(records: readonly AwgRouteRecord[], host: string): AwgRouteRecord | null {
  const key = hostKey(host);
  return records.find((record) => record.host && hostKey(record.host) === key) ?? null;
}

function anotherHostClaims(
  ip: string,
  host: string,
  records: readonly AwgRouteRecord[],
  otherHosts: readonly string[],
): boolean {
  const target = hostKey(host);
  for (const other of otherHosts) {
    if (canonicalIpv4(other) === ip) return true;
  }
  return records.some(
    (record) => record.host && hostKey(record.host) !== target && record.ip === ip,
  );
}

export function decideHostRemoval(input: {
  host: string;
  records: readonly AwgRouteRecord[];
  kernelIps: readonly string[];
  resolvedIp: string | null;
  otherHosts: readonly string[];
}): HostRemovalDecision {
  const records = normalizeRouteRecords(input.records);
  const kernel = kernelSet(input.kernelIps);
  const recorded = recordForHost(records, input.host);
  const literal = canonicalIpv4(input.host);
  const resolved = input.resolvedIp ? canonicalIpv4(input.resolvedIp) : null;
  const ip = recorded?.ip ?? literal ?? resolved;
  if (!ip) return { kind: "abort" };

  const installed = kernel.has(ip);
  const routeKept = installed && anotherHostClaims(ip, input.host, records, input.otherHosts);
  return {
    kind: "apply",
    ip,
    deleteIp: installed && !routeKept ? ip : null,
    routeKept,
  };
}

export function planReconcile(input: {
  hosts: readonly string[];
  records: readonly AwgRouteRecord[];
  kernelIps: readonly string[];
  resolvedByHost: ReadonlyMap<string, string | null>;
}): { records: AwgRouteRecord[] } {
  const records = normalizeRouteRecords(input.records);
  const kernel = kernelSet(input.kernelIps);
  const resolved = new Map<string, string | null>();
  for (const [host, ip] of input.resolvedByHost) {
    resolved.set(hostKey(host), ip ? canonicalIpv4(ip) : null);
  }

  const seen = new Set<string>();
  const next: AwgRouteRecord[] = [];
  let unresolved = false;
  for (const host of input.hosts) {
    const key = hostKey(host);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    const wanted = resolved.get(key) ?? null;
    if (wanted) {
      next.push({ ip: wanted, host: host.trim() });
      continue;
    }
    const previous = recordForHost(records, host);
    if (previous) {
      next.push({ ip: previous.ip, host: host.trim() });
      continue;
    }
    unresolved = true;
  }

  if (unresolved) {
    const claimed = new Set(next.map((record) => record.ip));
    for (const ip of kernel) {
      if (!claimed.has(ip)) next.push({ ip, host: "" });
    }
  }

  return { records: dedupeRecords(next) };
}

export function projectAwgRoutes(input: {
  servers: readonly ServerIdentity[];
  records: readonly AwgRouteRecord[];
  kernelIps: readonly string[];
}): { servers: AwgRoutedServerRow[]; orphans: { ip: string }[] } {
  const records = normalizeRouteRecords(input.records);
  const kernel = kernelSet(input.kernelIps);
  const rows = input.servers.map((server) => {
    const recorded = recordForHost(records, server.host);
    const literal = canonicalIpv4(server.host);
    const candidate = recorded?.ip ?? literal;
    const installed = candidate !== null && kernel.has(candidate);
    return {
      id: server.id,
      name: server.name,
      host: server.host,
      port: server.port,
      ip: candidate,
      installed,
    };
  });

  return {
    servers: rows.map((row) => ({
      ...row,
      sameHost: rows
        .filter((other) => hostKey(other.host) === hostKey(row.host))
        .map((other) => ({ id: other.id, name: other.name })),
      sharesIpWith: rows
        .filter(
          (other) =>
            other.id !== row.id &&
            hostKey(other.host) !== hostKey(row.host) &&
            row.installed &&
            other.installed &&
            other.ip === row.ip,
        )
        .map((other) => ({ id: other.id, name: other.name })),
    })),
    orphans: [...kernel]
      .filter((ip) => !rows.some((row) => row.installed && row.ip === ip))
      .sort()
      .map((ip) => ({ ip })),
  };
}

export function decideOrphanRemoval(input: {
  ip: string;
  records: readonly AwgRouteRecord[];
  kernelIps: readonly string[];
  hosts: readonly string[];
}): { ok: true; ip: string } | { ok: false; reason: "missing" | "claimed" } {
  const ip = canonicalIpv4(input.ip);
  if (!ip || !kernelSet(input.kernelIps).has(ip)) return { ok: false, reason: "missing" };
  const records = normalizeRouteRecords(input.records);
  const claimed = input.hosts.some((host) => {
    if (canonicalIpv4(host) === ip) return true;
    return recordForHost(records, host)?.ip === ip;
  });
  if (claimed) return { ok: false, reason: "claimed" };
  return { ok: true, ip };
}
