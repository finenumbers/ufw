import type { ActiveOperation } from "@/types/operation";

const ACTIVE_OPERATION_STATUSES = new Set(["RUNNING", "PENDING"]);
const TERMINAL_OPERATION_STATUSES = new Set(["SUCCESS", "FAILED", "PARTIAL"]);

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
