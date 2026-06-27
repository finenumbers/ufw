import { db } from "@/lib/db";

export async function sweepStaleApplySessions(maxAgeMinutes = 30): Promise<number> {
  const staleBefore = new Date(Date.now() - maxAgeMinutes * 60_000);
  const result = await db.applySession.updateMany({
    where: {
      status: "RUNNING",
      confirmedAt: { lt: staleBefore },
    },
    data: {
      status: "FAILED",
      errorMessage: "Apply session timed out",
      completedAt: new Date(),
    },
  });

  return result.count;
}

export async function sweepStalePendingApplySessions(maxAgeMinutes = 60): Promise<number> {
  const staleBefore = new Date(Date.now() - maxAgeMinutes * 60_000);
  const result = await db.applySession.updateMany({
    where: {
      status: "PENDING",
      createdAt: { lt: staleBefore },
    },
    data: {
      status: "CANCELLED",
      completedAt: new Date(),
      errorMessage: "Apply preview expired",
    },
  });

  return result.count;
}

export async function sweepStalePendingOperationLogs(maxAgeMinutes = 60): Promise<number> {
  const staleBefore = new Date(Date.now() - maxAgeMinutes * 60_000);
  const result = await db.operationLog.updateMany({
    where: {
      status: "PENDING",
      createdAt: { lt: staleBefore },
    },
    data: {
      status: "CANCELLED",
      message: "messages.operation_cancelled",
    },
  });

  return result.count;
}

export async function sweepStaleRunningOperationLogs(maxAgeMinutes = 30): Promise<number> {
  const staleBefore = new Date(Date.now() - maxAgeMinutes * 60_000);
  const result = await db.operationLog.updateMany({
    where: {
      status: "RUNNING",
      createdAt: { lt: staleBefore },
    },
    data: {
      status: "FAILED",
      message: "messages.operation_timed_out",
    },
  });

  return result.count;
}

export async function prepareServersForMaintenanceOperation(): Promise<void> {
  await Promise.all([
    sweepStaleApplySessions(),
    sweepStalePendingApplySessions(),
    sweepStalePendingOperationLogs(),
    sweepStaleRunningOperationLogs(),
  ]);
}
