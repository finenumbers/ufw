import { queryCheburcheck } from "@/lib/block-check/client";
import {
  applyObservation,
  isHostDue,
  probeDelayMs,
  shouldStartBlockCheckRefresh,
  type HostBlockState,
} from "@/lib/block-check/schedule";
import { blockCheckHostKey, canQueryBlockCheckHost } from "@/lib/block-check/target";
import { db } from "@/lib/db";
import { createChildLogger } from "@/lib/logger";
import type { BlockCheckSnapshot, BlockCheckStatus } from "@/types/block-check";

const log = createChildLogger("block-check");
const REFRESH_BACKOFF_MS = 60_000;

type BlockCheckState = {
  servers: Array<{ id: string; host: string }>;
  hosts: Map<string, HostBlockState>;
  inflight: Promise<void> | null;
  backoffUntil: number;
  lastProbeStartedAt: number;
};

type BlockCheckGlobal = typeof globalThis & {
  __ufwBlockCheckState?: BlockCheckState;
};

function createState(): BlockCheckState {
  return {
    servers: [],
    hosts: new Map(),
    inflight: null,
    backoffUntil: 0,
    lastProbeStartedAt: 0,
  };
}

function getState(): BlockCheckState {
  const globals = globalThis as BlockCheckGlobal;
  if (!globals.__ufwBlockCheckState) {
    globals.__ufwBlockCheckState = createState();
  }
  return globals.__ufwBlockCheckState;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function getBlockCheckSnapshot(): BlockCheckSnapshot {
  const state = getState();
  return {
    refreshing: state.inflight != null,
    servers: state.servers.map((server) => ({
      id: server.id,
      status: statusForHost(state, server.host),
    })),
  };
}

function statusForHost(state: BlockCheckState, host: string): BlockCheckStatus {
  const entry = state.hosts.get(blockCheckHostKey(host));
  return entry?.status ?? "unknown";
}

export function ensureBlockCheckRefresh(now = Date.now()): void {
  const state = getState();
  if (
    !shouldStartBlockCheckRefresh({
      now,
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
    state.servers = servers.map((server) => ({ id: server.id, host: server.host }));
    const hosts = [
      ...new Set(
        servers
          .map((server) => server.host)
          .filter((host) => canQueryBlockCheckHost(host))
          .map((host) => blockCheckHostKey(host)),
      ),
    ].sort();

    for (const key of state.hosts.keys()) {
      if (!hosts.includes(key)) {
        state.hosts.delete(key);
      }
    }

    const now = Date.now();
    const due = hosts.filter((host) => isHostDue(state.hosts.get(host), now));
    for (const host of due) {
      await checkHost(state, host);
    }
  } catch (error) {
    state.backoffUntil = Date.now() + REFRESH_BACKOFF_MS;
    log.warn(
      { error: error instanceof Error ? error.message : String(error) },
      "Block check refresh failed",
    );
  }
}

async function checkHost(state: BlockCheckState, host: string): Promise<void> {
  const outcome = await queryCheburcheck(host, {
    beforeProbe: async () => {
      const delay = probeDelayMs(state.lastProbeStartedAt, Date.now());
      if (delay > 0) {
        await sleep(delay);
      }
      state.lastProbeStartedAt = Date.now();
    },
  });
  const next = applyObservation(
    state.hosts.get(host),
    outcome.kind === "verdict" && outcome.status
      ? { kind: "status", status: outcome.status }
      : { kind: "keep" },
    Date.now(),
  );
  state.hosts.set(host, next);

  if (outcome.kind === "verdict" && outcome.status) {
    log.info(
      { host, statusCode: outcome.statusCode, verdict: outcome.status, durationMs: outcome.durationMs },
      "Block check completed",
    );
    return;
  }

  if (outcome.statusCode != null && outcome.statusCode < 400) {
    log.info(
      { host, statusCode: outcome.statusCode, durationMs: outcome.durationMs },
      "Block check had no scanner verdict",
    );
    return;
  }

  log.warn(
    { host, statusCode: outcome.statusCode, durationMs: outcome.durationMs },
    "Block check kept previous verdict",
  );
}
