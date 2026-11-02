import { awgGate } from "@/lib/awg/gate";
import { canonicalIpv4 } from "@/lib/awg/policy";
import {
  decideHostRemoval,
  decideOrphanRemoval,
  normalizeRouteRecords,
  parseKernelRoutes,
  projectAwgRoutes,
  type AwgRouteRecord,
  type AwgRouteSnapshot,
} from "@/lib/awg/route-plan";
import { db } from "@/lib/db";
import { isServerQueueBusy } from "@/lib/queue/queue-registry";
import { awgHelperRequest } from "@/server/services/awg-helper-client";
import { awgLeaderHeld, ensureAwgLeaderLock } from "@/server/services/awg-lock";
import { resolveAwgIp } from "@/server/services/awg-steer";
import { createAuditEvent } from "@/server/services/audit.service";

const CONFIG_ID = "default";
const BUSY = "Wait for the running operation to finish";
const UNKNOWN_ROUTE = "Could not determine the AmneziaWG route";
const OTHER_INSTANCE = "AmneziaWG is already running in another instance";
const NOT_A_ROUTE = "This address is not an AmneziaWG route";
const ROUTE_CLAIMED = "This AmneziaWG route still belongs to a node";

type HelperRouteList = {
  up: boolean;
  kernel: unknown;
  records: AwgRouteRecord[];
};

type AwgServerRow = {
  id: string;
  name: string;
  host: string;
  port: number;
};

function publicAwgError(error: unknown, fallback: string): string {
  const message = error instanceof Error ? error.message : fallback;
  if (
    message.startsWith("AmneziaWG") ||
    message.startsWith("Wait for") ||
    message.startsWith("Could not") ||
    message.startsWith("Server not") ||
    message.startsWith("This address") ||
    message.startsWith("This AmneziaWG")
  ) {
    return message;
  }
  return fallback;
}

async function assertGroupIdle(serverIds: string[]): Promise<void> {
  if (serverIds.some((id) => isServerQueueBusy(id))) {
    throw new Error(BUSY);
  }
  const [operation, apply] = await Promise.all([
    db.operationLog.findFirst({
      where: { serverId: { in: serverIds }, status: { in: ["PENDING", "RUNNING"] } },
      select: { id: true },
    }),
    db.applySession.findFirst({
      where: { serverId: { in: serverIds }, status: { in: ["PENDING", "RUNNING"] } },
      select: { id: true },
    }),
  ]);
  if (operation || apply) throw new Error(BUSY);
}

async function readHelperRoutes(): Promise<HelperRouteList> {
  const listed = await awgHelperRequest<HelperRouteList>({ cmd: "routes" }, 8000);
  return {
    up: Boolean(listed.up),
    kernel: listed.kernel,
    records: normalizeRouteRecords(listed.records),
  };
}

function snapshot(
  availability: AwgRouteSnapshot["availability"],
  servers: AwgServerRow[],
  records: AwgRouteRecord[] = [],
  kernelIps: string[] = [],
): AwgRouteSnapshot {
  const projected = projectAwgRoutes({ servers, records, kernelIps });
  return {
    availability,
    canRemove: availability === "ready" || availability === "tunnel-down",
    servers: projected.servers,
    orphans: availability === "ready" ? projected.orphans : [],
  };
}

export async function listAwgRoutes(): Promise<AwgRouteSnapshot> {
  const servers = await db.server.findMany({
    where: { useAwg: true },
    select: { id: true, name: true, host: true, port: true },
    orderBy: [{ name: "asc" }, { port: "asc" }],
  });
  const config = await db.amneziaWgConfig.findUnique({
    where: { id: CONFIG_ID },
    select: { enabled: true },
  });
  if (!config?.enabled) return snapshot("tunnel-down", servers);

  try {
    const listed = await readHelperRoutes();
    if (!listed.up && !awgLeaderHeld()) return snapshot("other-instance", servers);
    return snapshot("ready", servers, listed.records, parseKernelRoutes(listed.kernel));
  } catch {
    if (!awgLeaderHeld()) return snapshot("other-instance", servers);
    return snapshot("helper-error", servers);
  }
}

export async function removeServerFromAwg(
  serverId: string,
  userId: string,
): Promise<{ routeKept: boolean }> {
  const server = await db.server.findUnique({ where: { id: serverId } });
  if (!server) throw new Error("Server not found");
  if (!server.useAwg) return { routeKept: false };

  const group = await db.server.findMany({
    where: { host: { equals: server.host, mode: "insensitive" }, useAwg: true },
    select: { id: true },
  });
  const ids = group.map((row) => row.id);
  await assertGroupIdle(ids);

  const outcome = await awgGate.exclusive(async () => {
    await assertGroupIdle(ids);
    const fresh = await db.server.findMany({
      where: { id: { in: ids }, useAwg: true },
      select: { id: true, host: true },
    });
    if (fresh.length === 0) return { changed: false, routeKept: false };

    const host = fresh[0]?.host ?? server.host;
    const config = await db.amneziaWgConfig.findUnique({ where: { id: CONFIG_ID } });
    if (!config?.enabled) {
      await db.server.updateMany({
        where: { id: { in: fresh.map((row) => row.id) } },
        data: { useAwg: false },
      });
      return { changed: true, routeKept: false };
    }

    if (!(await ensureAwgLeaderLock())) throw new Error(OTHER_INSTANCE);
    const listed = await readHelperRoutes();
    const kernelIps = listed.up ? parseKernelRoutes(listed.kernel) : [];
    const recorded = listed.records.find(
      (record) => record.host.toLowerCase() === host.toLowerCase(),
    );
    let resolved: string | null = null;
    if (!recorded && !canonicalIpv4(host)) {
      try {
        resolved = canonicalIpv4(await resolveAwgIp(host, config));
      } catch {
        resolved = null;
      }
    }
    const others = await db.server.findMany({
      where: {
        useAwg: true,
        NOT: { host: { equals: host, mode: "insensitive" } },
      },
      select: { host: true },
    });
    const decision = decideHostRemoval({
      host,
      records: listed.records,
      kernelIps,
      resolvedIp: resolved,
      otherHosts: others.map((row) => row.host),
    });
    if (decision.kind === "abort") throw new Error(UNKNOWN_ROUTE);

    if (decision.deleteIp) {
      await awgHelperRequest({ cmd: "remove-route", ip: decision.deleteIp });
    } else if (recorded) {
      await awgHelperRequest({ cmd: "drop-host", host });
    }
    await db.server.updateMany({
      where: { id: { in: fresh.map((row) => row.id) } },
      data: { useAwg: false },
    });
    return { changed: true, routeKept: decision.routeKept };
  });

  if (outcome.changed) {
    await createAuditEvent({
      userId,
      action: "SERVER_UPDATED",
      entityType: "server",
      entityId: serverId,
      metadata: { useAwg: false, source: "awg-routes", serverIds: ids },
    });
  }
  return { routeKept: outcome.routeKept };
}

export async function removeOrphanAwgRoute(ip: string): Promise<void> {
  const canonical = canonicalIpv4(ip);
  if (!canonical) throw new Error(NOT_A_ROUTE);

  await awgGate.exclusive(async () => {
    const config = await db.amneziaWgConfig.findUnique({
      where: { id: CONFIG_ID },
      select: { enabled: true },
    });
    if (!config?.enabled) throw new Error("AmneziaWG is down");
    if (!(await ensureAwgLeaderLock())) throw new Error(OTHER_INSTANCE);
    const listed = await readHelperRoutes();
    const servers = await db.server.findMany({
      where: { useAwg: true },
      select: { host: true },
    });
    const decision = decideOrphanRemoval({
      ip: canonical,
      records: listed.records,
      kernelIps: listed.up ? parseKernelRoutes(listed.kernel) : [],
      hosts: servers.map((row) => row.host),
    });
    if (!decision.ok && decision.reason === "claimed") throw new Error(ROUTE_CLAIMED);
    if (!decision.ok) throw new Error(NOT_A_ROUTE);
    await awgHelperRequest({ cmd: "remove-route", ip: decision.ip });
  });
}

export function awgRouteError(error: unknown, fallback: string): string {
  return publicAwgError(error, fallback);
}
