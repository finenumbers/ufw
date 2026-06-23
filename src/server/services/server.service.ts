import type { AuthMethod, Server } from "@prisma/client";

import { decryptCredential, encryptCredential } from "@/lib/crypto";
import { db } from "@/lib/db";
import { clearServerQueue, isServerQueueBusy, waitForServerQueueIdle } from "@/lib/queue/queue-registry";
import type { ServerInput } from "@/lib/validations/server";
import { createAuditEvent } from "@/server/services/audit.service";
import { createOperationLog } from "@/server/services/operation-log.service";
import { verifySshConnection } from "@/lib/ssh/verify";
import { testSshConnection } from "@/server/services/ssh.service";

export async function listServers(): Promise<Server[]> {
  return db.server.findMany({ orderBy: { name: "asc" } });
}

export async function getServerById(id: string): Promise<Server | null> {
  return db.server.findUnique({ where: { id } });
}

export async function getServerByHost(host: string): Promise<Server | null> {
  return db.server.findFirst({ where: { host } });
}

export async function createServer(
  input: ServerInput,
  userId: string,
): Promise<{ success: true; server: Server } | { success: false; error: string }> {
  const sshResult = await verifyServerSsh({
    host: input.host,
    port: input.port,
    username: input.username,
    authMethod: input.authMethod,
    password: input.password,
    privateKey: input.privateKey,
    passphrase: input.passphrase,
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

  const encrypted = encryptCredential({
    password: input.password,
    privateKey: input.privateKey,
    passphrase: input.passphrase,
  });

  const server = await db.server.create({
    data: {
      name: input.name,
      host: input.host,
      port: input.port,
      username: input.username,
      authMethod: input.authMethod as AuthMethod,
      sshHostKeyFingerprint: sshResult.hostKeyFingerprint ?? null,
      credential: {
        create: {
          encryptedData: encrypted.encryptedData,
          iv: encrypted.iv,
          authTag: encrypted.authTag,
          keyVersion: encrypted.keyVersion,
        },
      },
    },
  });

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

  const hostChanged =
    existing.host !== input.host || existing.port !== input.port;
  const expectedHostKeyFingerprint = hostChanged
    ? null
    : existing.sshHostKeyFingerprint;

  const sshResult = await verifyServerSsh({
    host: input.host,
    port: input.port,
    username: input.username,
    authMethod: input.authMethod,
    password: input.password,
    privateKey: input.privateKey,
    passphrase: input.passphrase,
    expectedHostKeyFingerprint,
  });

  if (!sshResult.success) {
    return { success: false, error: sshResult.message };
  }

  const encrypted = encryptCredential({
    password: input.password,
    privateKey: input.privateKey,
    passphrase: input.passphrase,
  });

  const server = await db.server.update({
    where: { id },
    data: {
      name: input.name,
      host: input.host,
      port: input.port,
      username: input.username,
      authMethod: input.authMethod as AuthMethod,
      sshHostKeyFingerprint:
        sshResult.hostKeyFingerprint ?? existing.sshHostKeyFingerprint,
      credential: {
        upsert: {
          create: {
            encryptedData: encrypted.encryptedData,
            iv: encrypted.iv,
            authTag: encrypted.authTag,
            keyVersion: encrypted.keyVersion,
          },
          update: {
            encryptedData: encrypted.encryptedData,
            iv: encrypted.iv,
            authTag: encrypted.authTag,
            keyVersion: encrypted.keyVersion,
          },
        },
      },
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
    include: { credential: true },
  });

  if (!server?.credential) {
    throw new Error("Server or credentials not found");
  }

  const secrets = decryptCredential({
    encryptedData: server.credential.encryptedData,
    iv: server.credential.iv,
    authTag: server.credential.authTag,
    keyVersion: server.credential.keyVersion,
  });

  return {
    host: server.host,
    port: server.port,
    username: server.username,
    authMethod: server.authMethod,
    password: secrets.password,
    privateKey: secrets.privateKey,
    passphrase: secrets.passphrase,
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

    await tracker.completeStep("ssh");
    await tracker.complete({ key: "messages.ssh_complete" });
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "SSH test failed";
    await tracker.fail({ key: "messages.operation_failed", params: { error: message } }, [message]);
    throw error;
  }
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
