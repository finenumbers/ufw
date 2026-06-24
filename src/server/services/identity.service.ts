import type { AuthMethod, Prisma } from "@prisma/client";

import { decryptCredential, encryptCredential } from "@/lib/crypto";
import { db } from "@/lib/db";
import type {
  IdentityCreateInput,
  IdentityDetail,
  IdentityListItem,
  IdentityUpdateInput,
} from "@/lib/validations/identity";
import { createAuditEvent } from "@/server/services/audit.service";

export async function listIdentities(): Promise<IdentityListItem[]> {
  const identities = await db.sshIdentity.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { servers: true } },
    },
  });

  return identities.map((identity) => ({
    id: identity.id,
    name: identity.name,
    username: identity.username,
    authMethod: identity.authMethod,
    serverCount: identity._count.servers,
  }));
}

export async function getIdentityById(id: string): Promise<IdentityDetail | null> {
  const identity = await db.sshIdentity.findUnique({
    where: { id },
    include: {
      servers: {
        select: { id: true, name: true, host: true, port: true },
        orderBy: { name: "asc" },
      },
      _count: { select: { servers: true } },
    },
  });

  if (!identity) {
    return null;
  }

  return {
    id: identity.id,
    name: identity.name,
    username: identity.username,
    authMethod: identity.authMethod,
    serverCount: identity._count.servers,
    linkedServers: identity.servers,
  };
}

export async function createIdentity(
  input: IdentityCreateInput,
  userId: string,
): Promise<{ success: true; identity: IdentityListItem } | { success: false; error: string }> {
  const existing = await db.sshIdentity.findUnique({ where: { name: input.name } });
  if (existing) {
    return { success: false, error: "An identity with this name already exists" };
  }

  const encrypted = encryptCredential({
    password: input.password,
    privateKey: input.privateKey,
    passphrase: input.passphrase,
  });

  const identity = await db.sshIdentity.create({
    data: {
      name: input.name,
      username: input.username,
      authMethod: input.authMethod,
      credential: {
        create: {
          encryptedData: encrypted.encryptedData,
          iv: encrypted.iv,
          authTag: encrypted.authTag,
          keyVersion: encrypted.keyVersion,
        },
      },
    },
    include: {
      _count: { select: { servers: true } },
    },
  });

  await createAuditEvent({
    userId,
    action: "IDENTITY_CREATED",
    entityType: "identity",
    entityId: identity.id,
    metadata: { name: identity.name, username: identity.username },
  });

  return {
    success: true,
    identity: {
      id: identity.id,
      name: identity.name,
      username: identity.username,
      authMethod: identity.authMethod,
      serverCount: identity._count.servers,
    },
  };
}

export async function updateIdentity(
  id: string,
  input: IdentityUpdateInput,
  userId: string,
): Promise<{ success: true; identity: IdentityListItem } | { success: false; error: string }> {
  const existing = await db.sshIdentity.findUnique({
    where: { id },
    include: { credential: true, _count: { select: { servers: true } } },
  });

  if (!existing) {
    return { success: false, error: "Identity not found" };
  }

  const nameConflict = await db.sshIdentity.findFirst({
    where: { name: input.name, NOT: { id } },
  });
  if (nameConflict) {
    return { success: false, error: "An identity with this name already exists" };
  }

  const hasSecretUpdate =
    Boolean(input.password) || Boolean(input.privateKey) || Boolean(input.passphrase);

  let credentialUpdate:
    | {
        encryptedData: string;
        iv: string;
        authTag: string;
        keyVersion: number;
      }
    | undefined;

  if (hasSecretUpdate) {
    credentialUpdate = encryptCredential({
      password: input.password,
      privateKey: input.privateKey,
      passphrase: input.passphrase,
    });
  } else if (input.authMethod !== existing.authMethod) {
    return {
      success: false,
      error: "Provide new credentials when changing the authentication method",
    };
  }

  const identity = await db.sshIdentity.update({
    where: { id },
    data: {
      name: input.name,
      username: input.username,
      authMethod: input.authMethod,
      ...(credentialUpdate
        ? {
            credential: {
              upsert: {
                create: credentialUpdate,
                update: credentialUpdate,
              },
            },
          }
        : {}),
    },
    include: {
      _count: { select: { servers: true } },
    },
  });

  await createAuditEvent({
    userId,
    action: "IDENTITY_UPDATED",
    entityType: "identity",
    entityId: identity.id,
    metadata: {
      name: identity.name,
      username: identity.username,
      serverCount: identity._count.servers,
    },
  });

  return {
    success: true,
    identity: {
      id: identity.id,
      name: identity.name,
      username: identity.username,
      authMethod: identity.authMethod,
      serverCount: identity._count.servers,
    },
  };
}

export async function deleteIdentity(
  id: string,
  userId: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const identity = await db.sshIdentity.findUnique({
    where: { id },
    include: {
      servers: { select: { id: true, name: true, host: true, port: true } },
    },
  });

  if (!identity) {
    return { success: false, error: "Identity not found" };
  }

  if (identity.servers.length > 0) {
    return {
      success: false,
      error: `Cannot delete identity used by ${identity.servers.length} server(s)`,
    };
  }

  await db.sshIdentity.delete({ where: { id } });

  await createAuditEvent({
    userId,
    action: "IDENTITY_DELETED",
    entityType: "identity",
    entityId: id,
    metadata: { name: identity.name },
  });

  return { success: true };
}

export async function resolveIdentitySecrets(identityId: string): Promise<{
  username: string;
  authMethod: AuthMethod;
  password?: string;
  privateKey?: string;
  passphrase?: string;
}> {
  const identity = await db.sshIdentity.findUnique({
    where: { id: identityId },
    include: { credential: true },
  });

  if (!identity?.credential) {
    throw new Error("Identity or credentials not found");
  }

  const secrets = decryptCredential({
    encryptedData: identity.credential.encryptedData,
    iv: identity.credential.iv,
    authTag: identity.credential.authTag,
    keyVersion: identity.credential.keyVersion,
  });

  return {
    username: identity.username,
    authMethod: identity.authMethod,
    password: secrets.password,
    privateKey: secrets.privateKey,
    passphrase: secrets.passphrase,
  };
}

export async function upsertIdentityFromConfig(
  input: {
    name: string;
    username: string;
    authMethod: AuthMethod | string;
    password?: string;
    privateKey?: string;
    passphrase?: string;
  },
  userId: string,
  options?: { tx?: Prisma.TransactionClient; skipAudit?: boolean },
): Promise<{ id: string; name: string }> {
  const identityDb = options?.tx ?? db;
  const encrypted = encryptCredential({
    password: input.password,
    privateKey: input.privateKey,
    passphrase: input.passphrase,
  });

  const existing = await identityDb.sshIdentity.findUnique({ where: { name: input.name } });

  if (existing) {
    const identity = await identityDb.sshIdentity.update({
      where: { id: existing.id },
      data: {
        username: input.username,
        authMethod: input.authMethod as AuthMethod,
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

    if (!options?.skipAudit) {
      await createAuditEvent({
        userId,
        action: "IDENTITY_UPDATED",
        entityType: "identity",
        entityId: identity.id,
        metadata: { name: identity.name, source: "config-import" },
      });
    }

    return { id: identity.id, name: identity.name };
  }

  const identity = await identityDb.sshIdentity.create({
    data: {
      name: input.name,
      username: input.username,
      authMethod: input.authMethod as AuthMethod,
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

  if (!options?.skipAudit) {
    await createAuditEvent({
      userId,
      action: "IDENTITY_CREATED",
      entityType: "identity",
      entityId: identity.id,
      metadata: { name: identity.name, source: "config-import" },
    });
  }

  return { id: identity.id, name: identity.name };
}
