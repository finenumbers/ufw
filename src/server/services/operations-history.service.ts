import { db } from "@/lib/db";
import { createAuditEvent } from "@/server/services/audit.service";

export async function clearOperationsHistory(
  userId: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const activeOperation = await db.operationLog.findFirst({
    where: { status: { in: ["PENDING", "RUNNING"] } },
  });

  if (activeOperation) {
    return {
      success: false,
      error: "RUNNING_OPERATION",
    };
  }

  const [operationCount, auditCount] = await Promise.all([
    db.operationLog.count(),
    db.auditEvent.count(),
  ]);

  const purgeAudit = await createAuditEvent({
    userId,
    action: "OPERATIONS_CLEARED",
    entityType: "operations",
    entityId: "history",
    metadata: {
      operationCount,
      auditCount,
    },
  });

  await db.$transaction([
    db.operationLog.deleteMany({}),
    db.auditEvent.deleteMany({
      where: { id: { not: purgeAudit.id } },
    }),
  ]);

  return { success: true };
}
