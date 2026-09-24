import dns from "node:dns/promises";
import PQueue from "p-queue";

import { db } from "@/lib/db";
import { createChildLogger } from "@/lib/logger";
import { applyAddressResults } from "@/lib/reachability/cycle";
import { probeAddress, type PingOutcome } from "@/lib/reachability/ping";
import type { HostObservation } from "@/lib/reachability/sample";
import {
  REACHABILITY_BACKOFF_MS,
  shouldStartReachabilityProbe,
} from "@/lib/reachability/schedule";
import { resolveProbeTarget, type ProbeTarget } from "@/lib/reachability/target";
import type { ReachabilitySnapshot, ServerReachability } from "@/types/reachability";

const log = createChildLogger("reachability");
const LOOKUP_TIMEOUT_MS = 2_000;
const PROBE_CONCURRENCY = 8;

type ReachabilityState = {
  probe: ReachabilitySnapshot["probe"];
  checkedAt: number | null;
  servers: ServerReachability[];
  inflight: Promise<void> | null;
  backoffUntil: number;
  observations: Map<string, HostObservation>;
};

type ReachabilityGlobal = typeof globalThis & {
  __ufwReachabilityState?: ReachabilityState;
};

function createState(): ReachabilityState {
  return {
    probe: "pending",
    checkedAt: null,
    servers: [],
    inflight: null,
    backoffUntil: 0,
    observations: new Map(),
  };
}

function getState(): ReachabilityState {
  const globals = globalThis as ReachabilityGlobal;
  if (!globals.__ufwReachabilityState) {
    globals.__ufwReachabilityState = createState();
  }
  return globals.__ufwReachabilityState;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("lookup timeout")), timeoutMs);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

async function lookupIpv4(hostname: string): Promise<string> {
  const result = await withTimeout(dns.lookup(hostname, { family: 4 }), LOOKUP_TIMEOUT_MS);
  return result.address;
}

export function getReachabilitySnapshot(): ReachabilitySnapshot {
  const state = getState();
  return {
    probe: state.probe,
    refreshing: state.inflight != null,
    checkedAt: state.checkedAt == null ? null : new Date(state.checkedAt).toISOString(),
    servers: state.probe === "pending" ? [] : state.servers,
  };
}

export function ensureReachabilityRefresh(now = Date.now()): void {
  const state = getState();
  if (
    !shouldStartReachabilityProbe({
      now,
      checkedAt: state.checkedAt,
      inflight: state.inflight != null,
      backoffUntil: state.backoffUntil,
    })
  ) {
    return;
  }

  const flight = refresh().finally(() => {
    const current = getState();
    if (current.inflight === flight) {
      current.inflight = null;
    }
  });
  state.inflight = flight;
}

async function refresh(): Promise<void> {
  const state = getState();
  try {
    const servers = await db.server.findMany({
      select: { id: true, host: true },
      orderBy: { name: "asc" },
    });
    const hosts = [...new Set(servers.map((server) => server.host))];
    const targets = new Map<string, ProbeTarget>();

    await Promise.all(
      hosts.map(async (host) => {
        targets.set(host, await resolveProbeTarget(host, lookupIpv4));
      }),
    );

    const ips = new Set<string>();
    for (const target of targets.values()) {
      if (target.kind === "ip") {
        ips.add(target.ip);
      }
    }

    const queue = new PQueue({ concurrency: PROBE_CONCURRENCY });
    const outcomes = new Map<string, PingOutcome>();

    await Promise.all(
      [...ips].map((ip) =>
        queue.add(async () => {
          outcomes.set(ip, await probeAddress(ip));
        }),
      ),
    );

    const cycle = applyAddressResults({
      servers,
      targets,
      outcomes,
      previous: state.observations,
    });
    state.observations = cycle.observations;
    state.servers = cycle.servers;
    state.checkedAt = Date.now();
    state.probe = "ready";
  } catch (error) {
    state.backoffUntil = Date.now() + REACHABILITY_BACKOFF_MS;
    log.warn(
      { error: error instanceof Error ? error.message : String(error) },
      "Reachability refresh failed",
    );
  }
}

