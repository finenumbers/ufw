export const REACHABILITY_INTERVAL_MS = 10_000;
export const REACHABILITY_BACKOFF_MS = 5_000;
export const REACHABILITY_STALE_MS = 30_000;

export function shouldStartReachabilityProbe(input: {
  now: number;
  checkedAt: number | null;
  inflight: boolean;
  backoffUntil: number;
}): boolean {
  if (input.inflight) {
    return false;
  }

  if (input.now < input.backoffUntil) {
    return false;
  }

  if (input.checkedAt == null) {
    return true;
  }

  return input.now - input.checkedAt >= REACHABILITY_INTERVAL_MS;
}
