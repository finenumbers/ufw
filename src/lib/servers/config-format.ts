import { z } from "zod";

import { authMethodSchema, refineAuthSecrets } from "@/lib/validations/auth-secrets";
import { validateSshHost } from "@/lib/validations/ssh-host";

export const identityConfigEntrySchema = z
  .object({
    name: z.string().min(1),
    username: z.string().min(1),
    authMethod: authMethodSchema,
    password: z.string().optional(),
    privateKey: z.string().optional(),
    passphrase: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    refineAuthSecrets(data, ctx, { requireSecrets: true });
  });

export const serverConfigEntrySchema = z
  .object({
    name: z.string().min(1),
    host: z.string().min(1),
    port: z.coerce.number().int().min(1).max(65535),
    identityName: z.string().min(1),
    sshHostKeyFingerprint: z.string().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    const hostError = validateSshHost(data.host);
    if (hostError) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: hostError,
        path: ["host"],
      });
    }
  });

export const serversConfigFileSchema = z.object({
  format: z.literal("ufw-remote-manager-servers"),
  version: z.literal(2),
  exportedAt: z.string().datetime().optional(),
  identities: z.array(identityConfigEntrySchema),
  servers: z.array(serverConfigEntrySchema),
});

export type IdentityConfigEntry = z.infer<typeof identityConfigEntrySchema>;
export type ServersConfigFileV2 = z.infer<typeof serversConfigFileSchema>;
export type ServersConfigFile = ServersConfigFileV2;

export type NormalizedServersConfig = {
  identities: IdentityConfigEntry[];
  servers: Array<{
    name: string;
    host: string;
    port: number;
    identityName: string;
    sshHostKeyFingerprint?: string | null;
  }>;
};

export const UNSUPPORTED_CONFIG_FORMAT_MESSAGE =
  "Unsupported configuration format. Export a v2 file from a current version.";

export function serverConfigKey(host: string, port: number, identityName: string): string {
  return `${host.toLowerCase()}:${port}:${identityName}`;
}

export function assertUniqueServerConfigKeys(
  servers: Array<{ host: string; port: number; identityName: string }>,
): void {
  const seen = new Set<string>();

  for (const server of servers) {
    const key = serverConfigKey(server.host, server.port, server.identityName);
    if (seen.has(key)) {
      throw new Error(`Duplicate server entry in configuration file: ${key}`);
    }
    seen.add(key);
  }
}

export function assertUniqueIdentityNames(identities: IdentityConfigEntry[]): void {
  const seen = new Set<string>();

  for (const identity of identities) {
    if (seen.has(identity.name)) {
      throw new Error(`Duplicate identity in configuration file: ${identity.name}`);
    }
    seen.add(identity.name);
  }
}

export type ServerConfigDiffEntry = {
  name: string;
  host: string;
  port: number;
  identityName: string;
};

export type ServersConfigImportDiff = {
  toCreate: ServerConfigDiffEntry[];
  toUpdate: ServerConfigDiffEntry[];
  toDelete: ServerConfigDiffEntry[];
};

export function normalizeServersConfigFile(file: ServersConfigFile): NormalizedServersConfig {
  assertUniqueIdentityNames(file.identities);
  assertUniqueServerConfigKeys(file.servers);

  const identityNames = new Set(file.identities.map((identity) => identity.name));
  for (const server of file.servers) {
    if (!identityNames.has(server.identityName)) {
      throw new Error(`Unknown identity referenced by server: ${server.identityName}`);
    }
  }

  return {
    identities: file.identities,
    servers: file.servers.map((server) => ({
      name: server.name,
      host: server.host,
      port: server.port,
      identityName: server.identityName,
      sshHostKeyFingerprint: server.sshHostKeyFingerprint,
    })),
  };
}

function normalizedEntryMatches(
  left: NormalizedServersConfig["servers"][number] & { identity: IdentityConfigEntry },
  right: {
    name: string;
    host: string;
    port: number;
    identityName: string;
    sshHostKeyFingerprint: string | null;
    identity: IdentityConfigEntry;
  },
): boolean {
  return (
    left.name === right.name &&
    left.host === right.host &&
    left.port === right.port &&
    left.identityName === right.identityName &&
    (left.sshHostKeyFingerprint ?? null) === (right.sshHostKeyFingerprint ?? null) &&
    left.identity.name === right.identity.name &&
    left.identity.username === right.identity.username &&
    left.identity.authMethod === right.identity.authMethod &&
    (left.identity.password ?? undefined) === (right.identity.password ?? undefined) &&
    (left.identity.privateKey ?? undefined) === (right.identity.privateKey ?? undefined) &&
    (left.identity.passphrase ?? undefined) === (right.identity.passphrase ?? undefined)
  );
}

export function diffServersConfigEntries(
  incoming: NormalizedServersConfig,
  existing: Array<{
    id: string;
    name: string;
    host: string;
    port: number;
    identityName: string;
    sshHostKeyFingerprint: string | null;
    identity: IdentityConfigEntry;
  }>,
): ServersConfigImportDiff {
  const incomingByKey = new Map(
    incoming.servers.map((entry) => [
      serverConfigKey(entry.host, entry.port, entry.identityName),
      entry,
    ]),
  );
  const existingByKey = new Map(
    existing.map((entry) => [
      serverConfigKey(entry.host, entry.port, entry.identityName),
      entry,
    ]),
  );

  const identityByName = new Map(incoming.identities.map((identity) => [identity.name, identity]));

  const toCreate: ServerConfigDiffEntry[] = [];
  const toUpdate: ServerConfigDiffEntry[] = [];
  const toDelete: ServerConfigDiffEntry[] = [];

  for (const entry of incoming.servers) {
    const key = serverConfigKey(entry.host, entry.port, entry.identityName);
    const current = existingByKey.get(key);
    const identity = identityByName.get(entry.identityName);

    if (!identity) {
      throw new Error(`Unknown identity referenced by server: ${entry.identityName}`);
    }

    const summary = {
      name: entry.name,
      host: entry.host,
      port: entry.port,
      identityName: entry.identityName,
    };

    if (!current) {
      toCreate.push(summary);
      continue;
    }

    if (
      !normalizedEntryMatches(
        { ...entry, identity },
        current,
      )
    ) {
      toUpdate.push(summary);
    }
  }

  for (const entry of existing) {
    const key = serverConfigKey(entry.host, entry.port, entry.identityName);
    if (!incomingByKey.has(key)) {
      toDelete.push({
        name: entry.name,
        host: entry.host,
        port: entry.port,
        identityName: entry.identityName,
      });
    }
  }

  return { toCreate, toUpdate, toDelete };
}

export function buildServersConfigFilename(date = new Date()): string {
  return `ufw-servers-${date.toISOString().slice(0, 10)}.json`;
}

export function serializeServersConfigFile(data: ServersConfigFile): string {
  return `${JSON.stringify(data, null, 2)}\n`;
}

function assertSupportedConfigVersion(parsed: unknown): void {
  if (Array.isArray(parsed)) {
    throw new Error(UNSUPPORTED_CONFIG_FORMAT_MESSAGE);
  }

  if (
    typeof parsed === "object" &&
    parsed !== null &&
    "version" in parsed &&
    parsed.version !== 2
  ) {
    throw new Error(UNSUPPORTED_CONFIG_FORMAT_MESSAGE);
  }
}

export function formatServersConfigParseError(error: unknown): string {
  if (error instanceof z.ZodError) {
    return error.issues
      .map((issue) => {
        const path = issue.path.length > 0 ? issue.path.join(".") : "configuration";
        return `${path}: ${issue.message}`;
      })
      .join("; ");
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Invalid configuration file";
}

export function parseServersConfigFile(content: string): ServersConfigFile {
  let parsed: unknown;

  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("Invalid JSON configuration file");
  }

  assertSupportedConfigVersion(parsed);

  const result = serversConfigFileSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(formatServersConfigParseError(result.error));
  }

  return result.data;
}

export function parseNormalizedServersConfigFile(content: string): NormalizedServersConfig {
  return normalizeServersConfigFile(parseServersConfigFile(content));
}
