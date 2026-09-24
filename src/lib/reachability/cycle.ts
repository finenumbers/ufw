import type { PingOutcome } from "@/lib/reachability/ping";
import { applyProbeSample, type HostObservation } from "@/lib/reachability/sample";
import type { ServerReachability } from "@/types/reachability";

function sampleFromOutcome(outcome: PingOutcome | undefined): {
  reachable: boolean;
  rttMs: number | null;
} {
  if (outcome?.kind === "reply") {
    return { reachable: true, rttMs: outcome.rttMs };
  }

  return { reachable: false, rttMs: null };
}

function serverFromPrevious(
  server: { id: string; host: string },
  previous: ReadonlyMap<string, HostObservation>,
): ServerReachability {
  const observation = previous.get(server.host);
  if (!observation) {
    return { id: server.id, status: "unknown", rttMs: null };
  }

  return { id: server.id, status: observation.status, rttMs: observation.rttMs };
}

export function applyAddressResults(input: {
  servers: Array<{ id: string; host: string }>;
  skipped: ReadonlySet<string>;
  outcomes: ReadonlyMap<string, PingOutcome>;
  previous: ReadonlyMap<string, HostObservation>;
}): {
  observations: Map<string, HostObservation>;
  servers: ServerReachability[];
  probeUnavailable: boolean;
} {
  const probeUnavailable = [...input.outcomes.values()].some((outcome) => outcome.kind === "unavailable");
  if (probeUnavailable) {
    return {
      probeUnavailable: true,
      observations: new Map(input.previous),
      servers: input.servers.map((server) => serverFromPrevious(server, input.previous)),
    };
  }

  const hosts = [...new Set(input.servers.map((server) => server.host))];
  const observations = new Map<string, HostObservation>();
  const byHost = new Map<string, HostObservation | "skip">();

  for (const host of hosts) {
    if (input.skipped.has(host)) {
      byHost.set(host, "skip");
      continue;
    }

    const outcome = input.outcomes.get(host);
    if (!outcome || outcome.kind === "unavailable") {
      byHost.set(host, "skip");
      continue;
    }

    const next = applyProbeSample(input.previous.get(host), sampleFromOutcome(outcome));
    observations.set(host, next);
    byHost.set(host, next);
  }

  return {
    probeUnavailable: false,
    observations,
    servers: input.servers.map((server) => {
      const observation = byHost.get(server.host);
      if (!observation || observation === "skip") {
        return { id: server.id, status: "unknown", rttMs: null };
      }

      return { id: server.id, status: observation.status, rttMs: observation.rttMs };
    }),
  };
}
