import type { OperationStatus, Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { TERMINAL_BANNER_TTL_MS } from "@/lib/operations/operation-banner-poll";

export async function createOperationLog(params: {
  serverId?: string | null;
  userId?: string | null;
  type: string;
  status: OperationStatus;
  message?: string;
  metadata?: Prisma.InputJsonValue;
}) {
  return db.operationLog.create({
    data: {
      serverId: params.serverId ?? null,
      userId: params.userId ?? null,
      type: params.type,
      status: params.status,
      message: params.message,
      metadata: params.metadata ?? undefined,
    },
  });
}

export async function listOperationLogs(params: {
  serverId?: string;
  page?: number;
  pageSize?: number;
}) {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 50;
  const skip = (page - 1) * pageSize;

  const where = params.serverId ? { serverId: params.serverId } : {};

  const [items, total] = await Promise.all([
    db.operationLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    db.operationLog.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function updateOperationLog(
  id: string,
  params: {
    status?: OperationStatus;
    message?: string;
    metadata?: Prisma.InputJsonValue;
  },
) {
  return db.operationLog.update({
    where: { id },
    data: {
      status: params.status,
      message: params.message,
      metadata: params.metadata,
    },
  });
}

export async function getActiveOperationLog(serverId: string, userId?: string) {
  return db.operationLog.findFirst({
    where: {
      serverId,
      status: { in: ["RUNNING", "PENDING"] },
      ...(userId ? { userId } : {}),
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getBannerOperationLog(serverId: string, userId?: string) {
  const active = await getActiveOperationLog(serverId, userId);
  if (active) {
    return active;
  }

  const cutoff = new Date(Date.now() - TERMINAL_BANNER_TTL_MS);
  return db.operationLog.findFirst({
    where: {
      serverId,
      status: { in: ["SUCCESS", "FAILED", "PARTIAL"] },
      ...(userId ? { userId } : {}),
      updatedAt: { gte: cutoff },
    },
    orderBy: { updatedAt: "desc" },
  });
}
