import { db } from "@/lib/db";

const DEFAULT_RUNNING_MAX_AGE_MINUTES = 45;
const DEFAULT_PENDING_MAX_AGE_MINUTES = 60;

function staleBefore(maxAgeMinutes: number): Date {
  return new Date(Date.now() - maxAgeMinutes * 60_000);
}

export async function sweepStaleApplySessions(
  maxAgeMinutes = DEFAULT_RUNNING_MAX_AGE_MINUTES,
): Promise<number> {
  const result = await db.applySession.updateMany({
    where: {
      status: "RUNNING",
      confirmedAt: { lt: staleBefore(maxAgeMinutes) },
    },
    data: {
      status: "FAILED",
      errorMessage: "Apply session timed out",
      completedAt: new Date(),
    },
  });

  return result.count;
}

export async function sweepStalePendingApplySessions(
  maxAgeMinutes = DEFAULT_PENDING_MAX_AGE_MINUTES,
): Promise<number> {
  const result = await db.applySession.updateMany({
    where: {
      status: "PENDING",
      createdAt: { lt: staleBefore(maxAgeMinutes) },
    },
    data: {
      status: "CANCELLED",
      completedAt: new Date(),
      errorMessage: "Apply preview expired",
    },
  });

  return result.count;
}

export async function sweepStalePendingOperationLogs(
  maxAgeMinutes = DEFAULT_PENDING_MAX_AGE_MINUTES,
): Promise<number> {
  const result = await db.operationLog.updateMany({
    where: {
      status: "PENDING",
      createdAt: { lt: staleBefore(maxAgeMinutes) },
    },
    data: {
      status: "CANCELLED",
      message: "messages.operation_cancelled",
    },
  });

  return result.count;
}

export async function sweepStaleRunningOperationLogs(
  maxAgeMinutes = DEFAULT_RUNNING_MAX_AGE_MINUTES,
): Promise<number> {
  const result = await db.operationLog.updateMany({
    where: {
      status: "RUNNING",
      updatedAt: { lt: staleBefore(maxAgeMinutes) },
    },
    data: {
      status: "FAILED",
      message: "messages.operation_timed_out",
    },
  });

  return result.count;
}

export async function sweepStalePortScans(
  maxAgeMinutes = DEFAULT_RUNNING_MAX_AGE_MINUTES,
): Promise<number> {
  const result = await db.portScan.updateMany({
    where: {
      status: { in: ["RUNNING", "PENDING"] },
      startedAt: { lt: staleBefore(maxAgeMinutes) },
    },
    data: {
      status: "FAILED",
      errorMessage: "Port scan timed out",
      completedAt: new Date(),
    },
  });

  return result.count;
}

export async function sweepStaleDockerInventories(
  maxAgeMinutes = DEFAULT_RUNNING_MAX_AGE_MINUTES,
): Promise<number> {
  const result = await db.dockerInventorySnapshot.updateMany({
    where: {
      status: { in: ["RUNNING", "PENDING"] },
      capturedAt: { lt: staleBefore(maxAgeMinutes) },
    },
    data: {
      status: "FAILED",
      errorMessage: "Docker inventory refresh timed out",
    },
  });

  return result.count;
}

export async function prepareServersForMaintenanceOperation(): Promise<{
  applyRunning: number;
  applyPending: number;
  operationPending: number;
  operationRunning: number;
  portScans: number;
  dockerInventories: number;
}> {
  const [
    applyRunning,
    applyPending,
    operationPending,
    operationRunning,
    portScans,
    dockerInventories,
  ] = await Promise.all([
    sweepStaleApplySessions(),
    sweepStalePendingApplySessions(),
    sweepStalePendingOperationLogs(),
    sweepStaleRunningOperationLogs(),
    sweepStalePortScans(),
    sweepStaleDockerInventories(),
  ]);

  return {
    applyRunning,
    applyPending,
    operationPending,
    operationRunning,
    portScans,
    dockerInventories,
  };
}
