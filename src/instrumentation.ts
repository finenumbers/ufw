import { validateProductionEnv } from "@/lib/env-validation";

export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") {
    return;
  }

  if (process.env.NODE_ENV !== "production" || process.env.NEXT_PHASE === "phase-production-build") {
    return;
  }

  validateProductionEnv();

  const { sweepStaleApplySessions, sweepStalePendingApplySessions, sweepStalePendingOperationLogs, sweepStaleRunningOperationLogs } =
    await import("@/server/services/apply-maintenance");
  const [runningSwept, pendingApplySwept, pendingLogSwept, runningLogSwept] = await Promise.all([
    sweepStaleApplySessions(),
    sweepStalePendingApplySessions(),
    sweepStalePendingOperationLogs(),
    sweepStaleRunningOperationLogs(),
  ]);
  const swept = runningSwept + pendingApplySwept + pendingLogSwept + runningLogSwept;
  if (swept > 0) {
    const { createChildLogger } = await import("@/lib/logger");
    createChildLogger("startup").warn({ swept }, "Marked stale apply sessions as failed");
  }
}
