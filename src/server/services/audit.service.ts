import type { AuditAction, Prisma } from "@prisma/client";

import { db } from "@/lib/db";

export async function createAuditEvent(params: {
  userId?: string | null;
  action: AuditAction;
  entityType?: string;
  entityId?: string;
  metadata?: Prisma.InputJsonValue;
}) {
  return db.auditEvent.create({
    data: {
      userId: params.userId ?? null,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      metadata: params.metadata ?? undefined,
    },
  });
}

export async function listAuditEvents(params: {
  page?: number;
  pageSize?: number;
  serverId?: string;
}) {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 50;
  const skip = (page - 1) * pageSize;

  const where = params.serverId
    ? {
        OR: [
          { entityType: "server", entityId: params.serverId },
          {
            metadata: {
              path: ["serverId"],
              equals: params.serverId,
            },
          },
        ],
      }
    : {};

  const [items, total] = await Promise.all([
    db.auditEvent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      include: { user: { select: { name: true, email: true } } },
    }),
    db.auditEvent.count({ where }),
  ]);

  return { items, total, page, pageSize };
}
