import { validateProductionEnv } from "@/lib/env-validation";

const MAINTENANCE_SWEEP_INTERVAL_MS = 15 * 60 * 1000;

type MaintenanceGlobals = typeof globalThis & {
  __ufwMaintenanceInterval?: ReturnType<typeof setInterval>;
  __ufwMaintenanceStarted?: boolean;
};

function startPeriodicMaintenanceSweep(): void {
  const globals = globalThis as MaintenanceGlobals;
  if (globals.__ufwMaintenanceStarted) {
    return;
  }

  globals.__ufwMaintenanceStarted = true;
  globals.__ufwMaintenanceInterval = setInterval(() => {
    void import("@/server/services/apply-maintenance")
      .then(({ prepareServersForMaintenanceOperation }) => prepareServersForMaintenanceOperation())
      .catch(async (error) => {
        const { createChildLogger } = await import("@/lib/logger");
        createChildLogger("maintenance").warn(
          { error: error instanceof Error ? error.message : String(error) },
          "Periodic maintenance sweep failed",
        );
      });
  }, MAINTENANCE_SWEEP_INTERVAL_MS);

  if (typeof globals.__ufwMaintenanceInterval.unref === "function") {
    globals.__ufwMaintenanceInterval.unref();
  }
}

export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") {
    return;
  }

  if (process.env.NODE_ENV !== "production" || process.env.NEXT_PHASE === "phase-production-build") {
    return;
  }

  validateProductionEnv();

  try {
    const { prepareServersForMaintenanceOperation } = await import(
      "@/server/services/apply-maintenance"
    );
    const swept = await prepareServersForMaintenanceOperation();
    const total =
      swept.applyRunning +
      swept.applyPending +
      swept.operationPending +
      swept.operationRunning +
      swept.portScans;

    if (total > 0) {
      const { createChildLogger } = await import("@/lib/logger");
      createChildLogger("startup").warn({ swept }, "Marked stale operations as failed or cancelled");
    }
  } catch (error) {
    const { createChildLogger } = await import("@/lib/logger");
    createChildLogger("startup").warn(
      { error: error instanceof Error ? error.message : String(error) },
      "Startup maintenance sweep skipped (database unavailable)",
    );
  }

  startPeriodicMaintenanceSweep();
}
