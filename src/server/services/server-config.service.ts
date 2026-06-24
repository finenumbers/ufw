import type { Prisma } from "@prisma/client";

import { decryptCredential } from "@/lib/crypto";
import { db } from "@/lib/db";
import { clearServerQueue, isServerQueueBusy } from "@/lib/queue/queue-registry";
import {
  buildServersConfigFilename,
  diffServersConfigEntries,
  parseNormalizedServersConfigFile,
  serverConfigKey,
  type IdentityConfigEntry,
  type NormalizedServersConfig,
  type ServersConfigFileV2,
  type ServersConfigImportDiff,
} from "@/lib/servers/config-format";
import { createAuditEvent } from "@/server/services/audit.service";
import { prepareServersForMaintenanceOperation } from "@/server/services/apply-maintenance";
import { upsertIdentityFromConfig } from "@/server/services/identity.service";
import { upsertServerFromConfig } from "@/server/services/server.service";

type ExistingConfigSnapshotEntry = Awaited<
  ReturnType<typeof listExistingConfigSnapshot>
>[number];

async function listExistingConfigSnapshot() {
  const servers = await db.server.findMany({
    include: {
      identity: { include: { credential: true } },
    },
    orderBy: { name: "asc" },
  });

  return Promise.all(
    servers.map(async (server) => {
      if (!server.identity.credential) {
        throw new Error(`Identity credentials missing for ${server.host}`);
      }

      const secrets = decryptCredential({
        encryptedData: server.identity.credential.encryptedData,
        iv: server.identity.credential.iv,
        authTag: server.identity.credential.authTag,
        keyVersion: server.identity.credential.keyVersion,
      });

      const identity: IdentityConfigEntry = {
        name: server.identity.name,
        username: server.identity.username,
        authMethod: server.identity.authMethod,
        password: secrets.password,
        privateKey: secrets.privateKey,
        passphrase: secrets.passphrase,
      };

      return {
        id: server.id,
        name: server.name,
        host: server.host,
        port: server.port,
        identityName: server.identity.name,
        sshHostKeyFingerprint: server.sshHostKeyFingerprint,
        identity,
      };
    }),
  );
}

export async function buildServersConfigExport(
  userId: string,
): Promise<{
  data: ServersConfigFileV2;
  filename: string;
}> {
  const servers = await listExistingConfigSnapshot();
  const exportedAt = new Date().toISOString();

  const identitiesByName = new Map<string, IdentityConfigEntry>();
  for (const server of servers) {
    identitiesByName.set(server.identity.name, server.identity);
  }

  const data: ServersConfigFileV2 = {
    format: "ufw-remote-manager-servers",
    version: 2,
    exportedAt,
    identities: Array.from(identitiesByName.values()).map((identity) => ({
      name: identity.name,
      username: identity.username,
      authMethod: identity.authMethod,
      ...(identity.password ? { password: identity.password } : {}),
      ...(identity.privateKey ? { privateKey: identity.privateKey } : {}),
      ...(identity.passphrase ? { passphrase: identity.passphrase } : {}),
    })),
    servers: servers.map((server) => ({
      name: server.name,
      host: server.host,
      port: server.port,
      identityName: server.identityName,
      sshHostKeyFingerprint: server.sshHostKeyFingerprint,
    })),
  };

  await createAuditEvent({
    userId,
    action: "CONFIG_EXPORT",
    entityType: "config",
    entityId: "servers-config",
    metadata: {
      identityCount: data.identities.length,
      serverCount: data.servers.length,
    },
  });

  return {
    data,
    filename: buildServersConfigFilename(new Date(exportedAt)),
  };
}

export async function diffServersConfigImport(content: string): Promise<ServersConfigImportDiff> {
  const parsed = parseNormalizedServersConfigFile(content);
  const existing = await listExistingConfigSnapshot();
  return diffServersConfigEntries(parsed, existing);
}

async function assertNoActiveServerOperations(serverIds: string[]): Promise<void> {
  if (serverIds.length === 0) {
    return;
  }

  await prepareServersForMaintenanceOperation();

  const [runningOperation, activeApply] = await Promise.all([
    db.operationLog.findFirst({
      where: {
        serverId: { in: serverIds },
        status: "RUNNING",
      },
    }),
    db.applySession.findFirst({
      where: {
        serverId: { in: serverIds },
        status: "RUNNING",
      },
    }),
  ]);

  if (runningOperation || activeApply || serverIds.some((serverId) => isServerQueueBusy(serverId))) {
    throw new Error("Cannot import configuration while a server operation is running");
  }
}

async function applyNormalizedConfigInTransaction(
  tx: Prisma.TransactionClient,
  parsed: NormalizedServersConfig,
  userId: string,
): Promise<void> {
  const identityIdByName = new Map<string, string>();

  for (const identity of parsed.identities) {
    const saved = await upsertIdentityFromConfig(identity, userId, {
      tx,
      skipAudit: true,
    });
    identityIdByName.set(saved.name, saved.id);
  }

  for (const entry of parsed.servers) {
    const identityId = identityIdByName.get(entry.identityName);
    if (!identityId) {
      throw new Error(`Unknown identity referenced by server: ${entry.identityName}`);
    }

    const result = await upsertServerFromConfig(
      {
        name: entry.name,
        host: entry.host,
        port: entry.port,
        identityId,
        sshHostKeyFingerprint: entry.sshHostKeyFingerprint,
        sshHostKeyVerified: false,
      },
      userId,
      { tx, skipAudit: true },
    );

    if (!result.success) {
      throw new Error(result.error);
    }
  }
}

async function deleteRemovedServersInTransaction(
  tx: Prisma.TransactionClient,
  parsed: NormalizedServersConfig,
  existingSnapshot: ExistingConfigSnapshotEntry[],
): Promise<string[]> {
  const desiredKeys = new Set(
    parsed.servers.map((entry) =>
      serverConfigKey(entry.host, entry.port, entry.identityName),
    ),
  );

  const deletedServerIds: string[] = [];

  for (const existing of existingSnapshot) {
    const key = serverConfigKey(existing.host, existing.port, existing.identityName);
    if (desiredKeys.has(key)) {
      continue;
    }

    await tx.server.delete({ where: { id: existing.id } });
    deletedServerIds.push(existing.id);
  }

  return deletedServerIds;
}

export async function applyServersConfigImport(
  content: string,
  userId: string,
): Promise<{ diff: ServersConfigImportDiff }> {
  const parsed = parseNormalizedServersConfigFile(content);
  const diff = await diffServersConfigImport(content);
  const existingSnapshot = await listExistingConfigSnapshot();

  await assertNoActiveServerOperations(existingSnapshot.map((server) => server.id));

  const deletedServerIds = await db.$transaction(async (tx) => {
    await applyNormalizedConfigInTransaction(tx, parsed, userId);
    return deleteRemovedServersInTransaction(tx, parsed, existingSnapshot);
  });

  for (const serverId of deletedServerIds) {
    clearServerQueue(serverId);
  }

  await createAuditEvent({
    userId,
    action: "SERVER_UPDATED",
    entityType: "server",
    entityId: "config-import",
    metadata: {
      created: diff.toCreate.length,
      updated: diff.toUpdate.length,
      deleted: diff.toDelete.length,
    },
  });

  return { diff };
}
