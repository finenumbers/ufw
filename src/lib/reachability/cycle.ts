import type { PingOutcome } from "@/lib/reachability/ping";
import { applyProbeSample, type HostObservation } from "@/lib/reachability/sample";
import type { ProbeTarget } from "@/lib/reachability/target";
import type { ServerReachability } from "@/types/reachability";

export function sampleFromOutcome(outcome: PingOutcome | undefined): {
  reachable: boolean;
  rttMs: number | null;
} {
  if (outcome?.kind === "reply") {
    return { reachable: true, rttMs: outcome.rttMs };
  }

  return { reachable: false, rttMs: null };
}

export function applyAddressResults(input: {
  servers: Array<{ id: string; host: string }>;
  targets: ReadonlyMap<string, ProbeTarget>;
  outcomes: ReadonlyMap<string, PingOutcome>;
  previous: ReadonlyMap<string, HostObservation>;
}): {
  observations: Map<string, HostObservation>;
  servers: ServerReachability[];
} {
  const hosts = [...new Set(input.servers.map((server) => server.host))];
  const observations = new Map<string, HostObservation>();
  const byHost = new Map<string, HostObservation | "skip">();

  for (const host of hosts) {
    const target = input.targets.get(host);
    if (!target || target.kind === "skip") {
      byHost.set(host, "skip");
      continue;
    }

    const sample =
      target.kind === "unresolved"
        ? { reachable: false, rttMs: null }
        : sampleFromOutcome(input.outcomes.get(target.ip));
    const next = applyProbeSample(input.previous.get(host), sample);
    observations.set(host, next);
    byHost.set(host, next);
  }

  return {
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
