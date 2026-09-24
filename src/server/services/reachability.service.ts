import dns from "node:dns/promises";
import PQueue from "p-queue";

import { db } from "@/lib/db";
import { createChildLogger } from "@/lib/logger";
import { probeAddress, type PingOutcome } from "@/lib/reachability/ping";
import { applyProbeSample, type HostObservation } from "@/lib/reachability/sample";
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
  unavailableLogged: boolean;
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
    unavailableLogged: false,
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
      unavailable: state.probe === "unavailable",
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
    let unavailable = false;

    await Promise.all(
      [...ips].map((ip) =>
        queue.add(async () => {
          const outcome = await probeAddress(ip);
          outcomes.set(ip, outcome);
          if (outcome.kind === "unavailable") {
            unavailable = true;
          }
        }),
      ),
    );

    if (unavailable) {
      markProbeUnavailable(state, servers);
      return;
    }

    const liveHosts = new Set(hosts);
    for (const host of state.observations.keys()) {
      if (!liveHosts.has(host)) {
        state.observations.delete(host);
      }
    }

    const observations = new Map<string, HostObservation | "skip">();
    for (const host of hosts) {
      const target = targets.get(host);
      if (!target || target.kind === "skip") {
        observations.set(host, "skip");
        continue;
      }

      const sample =
        target.kind === "unresolved"
          ? { reachable: false, rttMs: null }
          : sampleFromOutcome(outcomes.get(target.ip));
      const next = applyProbeSample(state.observations.get(host), sample);
      state.observations.set(host, next);
      observations.set(host, next);
    }

    state.servers = servers.map((server) => {
      const observation = observations.get(server.host);
      if (!observation || observation === "skip") {
        return { id: server.id, status: "unknown" as const, rttMs: null };
      }
      return { id: server.id, status: observation.status, rttMs: observation.rttMs };
    });
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

function sampleFromOutcome(outcome: PingOutcome | undefined): { reachable: boolean; rttMs: number | null } {
  if (outcome?.kind === "reply") {
    return { reachable: true, rttMs: outcome.rttMs };
  }
  return { reachable: false, rttMs: null };
}

function markProbeUnavailable(
  state: ReachabilityState,
  servers: Array<{ id: string }>,
): void {
  state.probe = "unavailable";
  state.checkedAt = Date.now();
  state.servers = servers.map((server) => ({ id: server.id, status: "unknown", rttMs: null }));
  if (!state.unavailableLogged) {
    state.unavailableLogged = true;
    log.warn("ICMP probe unavailable: ping is missing or not permitted");
  }
}
