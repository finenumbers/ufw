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
import { shouldSkipPingHost } from "@/lib/reachability/target";
import type { ReachabilitySnapshot, ServerReachability } from "@/types/reachability";

const log = createChildLogger("reachability");
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
    const skipped = new Set(hosts.filter((host) => shouldSkipPingHost(host)));
    const queue = new PQueue({ concurrency: PROBE_CONCURRENCY });
    const outcomes = new Map<string, PingOutcome>();

    await Promise.all(
      hosts
        .filter((host) => !skipped.has(host))
        .map((host) =>
          queue.add(async () => {
            outcomes.set(host, await probeAddress(host));
          }),
        ),
    );

    const cycle = applyAddressResults({
      servers,
      skipped,
      outcomes,
      previous: state.observations,
    });
    if (cycle.probeUnavailable) {
      const reason = [...outcomes.values()].find((outcome) => outcome.kind === "unavailable");
      log.warn(
        { reason: reason?.kind === "unavailable" ? reason.reason : "ping failed" },
        "ICMP probe unavailable",
      );
    }
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

