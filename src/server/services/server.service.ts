import type { AuthMethod, Prisma, Server } from "@prisma/client";
import { Prisma as PrismaClient } from "@prisma/client";
import { db } from "@/lib/db";
import { clearServerQueue, isServerQueueBusy, waitForServerQueueIdle } from "@/lib/queue/queue-registry";
import type { ServerInput } from "@/lib/validations/server";
import { createAuditEvent } from "@/server/services/audit.service";
import { resolveIdentitySecrets } from "@/server/services/identity.service";
import { createOperationLog } from "@/server/services/operation-log.service";
import { verifySshConnection } from "@/lib/ssh/verify";
import { testSshConnection } from "@/server/services/ssh.service";

export const SERVER_DUPLICATE_ERROR = "SERVER_DUPLICATE";

async function findServerByConnection(
  host: string,
  port: number,
  identityId: string,
  excludeId?: string,
): Promise<Server | null> {
  return db.server.findFirst({
    where: {
      host,
      port,
      identityId,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
  });
}

export async function listServers() {
  return db.server.findMany({
    orderBy: { name: "asc" },
    include: {
      identity: {
        select: { id: true, name: true, username: true, authMethod: true },
      },
    },
  });
}

export async function listServersWithRuleCounts() {
  const servers = await listServers();
  const counts = await db.ruleRecord.groupBy({
    by: ["serverId"],
    _count: { id: true },
  });
  const countByServerId = new Map(counts.map((entry) => [entry.serverId, entry._count.id]));

  return servers.map((server) => ({
    ...server,
    ruleRecordCount: countByServerId.get(server.id) ?? 0,
  }));
}

export async function getServerById(id: string): Promise<Server | null> {
  return db.server.findUnique({ where: { id } });
}

export async function getServerByHost(host: string) {
  return db.server.findFirst({
    where: { host },
    include: {
      identity: {
        select: { id: true, name: true, username: true, authMethod: true },
      },
    },
  });
}

export async function createServer(
  input: ServerInput,
  userId: string,
): Promise<{ success: true; server: Server } | { success: false; error: string }> {
  const duplicate = await findServerByConnection(
    input.host,
    input.port,
    input.identityId,
  );
  if (duplicate) {
    return { success: false, error: SERVER_DUPLICATE_ERROR };
  }

  const identity = await resolveIdentitySecrets(input.identityId);

  const sshResult = await verifyServerSsh({
    host: input.host,
    port: input.port,
    username: identity.username,
    authMethod: identity.authMethod,
    password: identity.password,
    privateKey: identity.privateKey,
    passphrase: identity.passphrase,
  });

  if (!sshResult.success) {
    await createOperationLog({
      userId,
      type: "server.create",
      status: "FAILED",
      message: sshResult.message,
      metadata: { host: input.host },
    });
    return { success: false, error: sshResult.message };
  }

  let server: Server;
  try {
    server = await db.server.create({
      data: {
        name: input.name,
        host: input.host,
        port: input.port,
        identityId: input.identityId,
        sshHostKeyFingerprint: sshResult.hostKeyFingerprint ?? null,
        sshHostKeyVerified: Boolean(sshResult.hostKeyFingerprint),
      },
    });
  } catch (error) {
    if (
      error instanceof PrismaClient.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { success: false, error: SERVER_DUPLICATE_ERROR };
    }
    throw error;
  }

  await createAuditEvent({
    userId,
    action: "SERVER_CREATED",
    entityType: "server",
    entityId: server.id,
    metadata: { name: server.name, host: server.host },
  });

  await createOperationLog({
    serverId: server.id,
    userId,
    type: "server.create",
    status: "SUCCESS",
    message: "messages.server_create_complete",
    metadata: {
      messageI18n: {
        key: "messages.server_create_complete",
        params: { name: server.name },
      },
    },
  });

  return { success: true, server };
}

export async function updateServer(
  id: string,
  input: ServerInput,
  userId: string,
): Promise<{ success: true; server: Server } | { success: false; error: string }> {
  const existing = await db.server.findUnique({ where: { id } });
  if (!existing) {
    return { success: false, error: "Server not found" };
  }

  const duplicate = await findServerByConnection(
    input.host,
    input.port,
    input.identityId,
    id,
  );
  if (duplicate) {
    return { success: false, error: SERVER_DUPLICATE_ERROR };
  }

  const hostChanged =
    existing.host !== input.host || existing.port !== input.port;
  const expectedHostKeyFingerprint = hostChanged
    ? null
    : existing.sshHostKeyFingerprint;

  const identity = await resolveIdentitySecrets(input.identityId);

  const sshResult = await verifyServerSsh({
    host: input.host,
    port: input.port,
    username: identity.username,
    authMethod: identity.authMethod,
    password: identity.password,
    privateKey: identity.privateKey,
    passphrase: identity.passphrase,
    expectedHostKeyFingerprint,
  });

  if (!sshResult.success) {
    return { success: false, error: sshResult.message };
  }

  const server = await db.server.update({
    where: { id },
    data: {
      name: input.name,
      host: input.host,
      port: input.port,
      identityId: input.identityId,
      sshHostKeyFingerprint:
        sshResult.hostKeyFingerprint ?? existing.sshHostKeyFingerprint,
      sshHostKeyVerified: hostChanged
        ? Boolean(sshResult.hostKeyFingerprint)
        : existing.sshHostKeyVerified || Boolean(sshResult.hostKeyFingerprint),
    },
  });

  await createAuditEvent({
    userId,
    action: "SERVER_UPDATED",
    entityType: "server",
    entityId: server.id,
  });

  return { success: true, server };
}

export async function upsertServerFromConfig(
  input: {
    name: string;
    host: string;
    port: number;
    identityId: string;
    sshHostKeyFingerprint?: string | null;
    sshHostKeyVerified?: boolean;
  },
  userId: string,
  options?: { tx?: Prisma.TransactionClient; skipAudit?: boolean },
): Promise<{ success: true; server: Server } | { success: false; error: string }> {
  const serverDb = options?.tx ?? db;
  const existing = await serverDb.server.findFirst({
    where: {
      host: input.host,
      port: input.port,
      identityId: input.identityId,
    },
  });

  if (existing) {
    const server = await serverDb.server.update({
      where: { id: existing.id },
      data: {
        name: input.name,
        host: input.host,
        port: input.port,
        identityId: input.identityId,
        sshHostKeyFingerprint: input.sshHostKeyFingerprint ?? null,
        sshHostKeyVerified: input.sshHostKeyVerified ?? false,
      },
    });

    if (!options?.skipAudit) {
      await createAuditEvent({
        userId,
        action: "SERVER_UPDATED",
        entityType: "server",
        entityId: server.id,
        metadata: { name: server.name, host: server.host, source: "config-import" },
      });
    }

    return { success: true, server };
  }

  const server = await serverDb.server.create({
    data: {
      name: input.name,
      host: input.host,
      port: input.port,
      identityId: input.identityId,
      sshHostKeyFingerprint: input.sshHostKeyFingerprint ?? null,
      sshHostKeyVerified: input.sshHostKeyVerified ?? false,
    },
  });

  if (!options?.skipAudit) {
    await createAuditEvent({
      userId,
      action: "SERVER_CREATED",
      entityType: "server",
      entityId: server.id,
      metadata: { name: server.name, host: server.host, source: "config-import" },
    });
  }

  return { success: true, server };
}

export async function deleteServer(
  id: string,
  userId: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const server = await db.server.findUnique({ where: { id } });
  if (!server) {
    return { success: false, error: "Server not found" };
  }

  const [runningOperation, activeApply] = await Promise.all([
    db.operationLog.findFirst({
      where: { serverId: id, status: { in: ["PENDING", "RUNNING"] } },
    }),
    db.applySession.findFirst({
      where: { serverId: id, status: { in: ["PENDING", "RUNNING"] } },
    }),
  ]);

  if (runningOperation || activeApply || isServerQueueBusy(id)) {
    return {
      success: false,
      error: "Cannot delete server while an operation is running",
    };
  }

  await waitForServerQueueIdle(id);

  await db.operationLog.updateMany({
    where: { serverId: id, status: { in: ["PENDING", "RUNNING"] } },
    data: { status: "CANCELLED", message: "messages.operation_cancelled" },
  });

  await db.server.delete({ where: { id } });
  clearServerQueue(id);

  await createAuditEvent({
    userId,
    action: "SERVER_DELETED",
    entityType: "server",
    entityId: id,
    metadata: { name: server.name, host: server.host },
  });

  return { success: true };
}

export async function getServerSshConfig(serverId: string) {
  const server = await db.server.findUnique({
    where: { id: serverId },
    include: { identity: true },
  });

  if (!server) {
    throw new Error("Server not found");
  }

  const identity = await resolveIdentitySecrets(server.identityId);

  return {
    host: server.host,
    port: server.port,
    username: identity.username,
    authMethod: identity.authMethod,
    password: identity.password,
    privateKey: identity.privateKey,
    passphrase: identity.passphrase,
    expectedHostKeyFingerprint: server.sshHostKeyFingerprint,
  };
}

export async function testServerConnection(
  serverId: string,
  userId: string,
): Promise<{ success: boolean; message: string; hostname?: string }> {
  const { semanticStep, startOperation } = await import("@/server/services/operation-progress.service");
  const tracker = await startOperation({
    serverId,
    userId,
    type: "ssh.test",
    messageI18n: { key: "messages.ssh_start" },
    steps: [semanticStep("ssh", "steps.ssh")],
  });

  try {
    const result = await testSshConnection(serverId, {
      onStart: async () => {
        await tracker.markRunning();
        await tracker.startStep("ssh", semanticStep("ssh", "steps.ssh"));
      },
    });

    await createAuditEvent({
      userId,
      action: "SSH_TEST",
      entityType: "server",
      entityId: serverId,
      metadata: { success: result.success },
    });

    if (!result.success) {
      await tracker.failStep("ssh", result.message);
      await tracker.fail(
        { key: "messages.operation_failed", params: { error: result.message } },
        [result.message],
      );
      return result;
    }

    const { db } = await import("@/lib/db");
    await db.server.update({
      where: { id: serverId },
      data: { sshHostKeyVerified: true },
    });

    await tracker.completeStep("ssh");
    await tracker.complete({ key: "messages.ssh_complete" });
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "SSH test failed";
    await tracker.fail({ key: "messages.operation_failed", params: { error: message } }, [message]);
    throw error;
  }
}

export async function getRuleRecordCount(serverId: string): Promise<number> {
  return db.ruleRecord.count({ where: { serverId } });
}

async function verifyServerSsh(config: {
  host: string;
  port: number;
  username: string;
  authMethod: AuthMethod | string;
  password?: string;
  privateKey?: string;
  passphrase?: string;
  expectedHostKeyFingerprint?: string | null;
}) {
  return verifySshConnection({
    host: config.host,
    port: config.port,
    username: config.username,
    password: config.password,
    privateKey: config.privateKey,
    passphrase: config.passphrase,
    expectedHostKeyFingerprint: config.expectedHostKeyFingerprint,
  });
}
