import type { ActiveOperation } from "@/types/operation";

const ACTIVE_OPERATION_STATUSES = new Set(["RUNNING", "PENDING"]);
const TERMINAL_OPERATION_STATUSES = new Set(["SUCCESS", "FAILED", "PARTIAL"]);

/** Keep polling after OPERATION_STARTED even when the API returns null (race with server action). */
export const OPERATION_START_GRACE_PERIOD_MS = 10_000;
export const OPERATION_START_GRACE_POLL_MS = 400;

/** How long terminal operations stay visible in the banner API after completion. */
export const TERMINAL_BANNER_TTL_MS = 10_000;

export function isActiveOperationStatus(status: string | undefined): boolean {
  return status !== undefined && ACTIVE_OPERATION_STATUSES.has(status);
}

export function isTerminalBannerStatus(status: string | undefined): boolean {
  return status !== undefined && TERMINAL_OPERATION_STATUSES.has(status);
}

export function shouldNotifyOperationEnded(
  previousStatus: string | undefined,
  current: ActiveOperation | null,
): boolean {
  if (current && isTerminalBannerStatus(current.status)) {
    return true;
  }

  return isActiveOperationStatus(previousStatus) && current === null;
}

export function shouldContinueBannerPoll(current: ActiveOperation | null): boolean {
  return isActiveOperationStatus(current?.status);
}

export function isWithinOperationStartGracePeriod(
  graceStartedAtMs: number,
  nowMs: number = Date.now(),
): boolean {
  return nowMs - graceStartedAtMs < OPERATION_START_GRACE_PERIOD_MS;
}

export function shouldContinueGracePoll(
  graceStartedAtMs: number,
  current: ActiveOperation | null,
  nowMs: number = Date.now(),
): boolean {
  if (shouldContinueBannerPoll(current)) {
    return false;
  }
  if (current && isTerminalBannerStatus(current.status)) {
    return false;
  }
  return isWithinOperationStartGracePeriod(graceStartedAtMs, nowMs);
}

export function shouldNotifyGracePeriodExpired(
  graceStartedAtMs: number,
  current: ActiveOperation | null,
  sawActiveOperation: boolean,
  nowMs: number = Date.now(),
): boolean {
  if (sawActiveOperation || shouldContinueBannerPoll(current)) {
    return false;
  }
  return !isWithinOperationStartGracePeriod(graceStartedAtMs, nowMs);
}
