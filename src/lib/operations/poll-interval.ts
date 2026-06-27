/** Delay before the next client poll while an operation is PENDING/RUNNING. */
export function activeOperationPollDelayMs(attempt: number): number {
  if (attempt < 30) {
    return 1000;
  }
  if (attempt < 60) {
    return 3000;
  }
  return 5000;
}

export function isTerminalOperationStatus(status: string): boolean {
  return status === "SUCCESS" || status === "FAILED" || status === "PARTIAL";
}
