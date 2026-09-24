export type HostObservation = {
  status: "reachable" | "unreachable";
  rttMs: number | null;
  consecutiveFailures: number;
};

export function applyProbeSample(
  previous: HostObservation | undefined,
  sample: { reachable: boolean; rttMs: number | null },
): HostObservation {
  if (sample.reachable) {
    return {
      status: "reachable",
      rttMs: sample.rttMs,
      consecutiveFailures: 0,
    };
  }

  if (!previous || previous.status === "unreachable") {
    return {
      status: "unreachable",
      rttMs: null,
      consecutiveFailures: (previous?.consecutiveFailures ?? 0) + 1,
    };
  }

  const consecutiveFailures = previous.consecutiveFailures + 1;
  if (consecutiveFailures >= 2) {
    return {
      status: "unreachable",
      rttMs: null,
      consecutiveFailures,
    };
  }

  return {
    status: "reachable",
    rttMs: previous.rttMs,
    consecutiveFailures,
  };
}
