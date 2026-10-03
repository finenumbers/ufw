import { decryptUtf8, encryptUtf8 } from "@/lib/crypto";
import { db } from "@/lib/db";
import { awgGate } from "@/lib/awg/gate";
import { parseAmneziaWgConf, type SanitizedAwgConfig } from "@/lib/awg/parse-conf";
import { createChildLogger } from "@/lib/logger";
import { createAuditEvent } from "@/server/services/audit.service";
import {
  awgHelperRequest,
  AwgHelperError,
  type AwgHelperApply,
  type AwgHelperStatus,
} from "@/server/services/awg-helper-client";
import { awgLeaderHeld, ensureAwgLeaderLock } from "@/server/services/awg-lock";
import { resolveAwgIp } from "@/server/services/awg-steer";

const log = createChildLogger("awg");
const CONFIG_ID = "default";

export type AwgPublicStatus = {
  configured: boolean;
  enabled: boolean;
  leader: boolean;
  up: boolean;
  handshakeAgeSec: number | null;
  address: string | null;
  endpoint: string | null;
  allowedIps: string | null;
  updatedAt: string | null;
  error: string | null;
};

type StoredSecret = {
  setconf: string;
};

function handshakeAge(latestHandshake: number | null): number | null {
  if (!latestHandshake) {
    return null;
  }
  return Math.max(0, Math.floor(Date.now() / 1000) - latestHandshake);
}

async function requireLeader(): Promise<void> {
  const leader = await ensureAwgLeaderLock();
  if (!leader) {
    throw new Error("AmneziaWG is already running in another instance");
  }
}

function applyPayload(parsed: SanitizedAwgConfig): AwgHelperApply {
  return {
    address: parsed.address,
    mtu: parsed.mtu,
    endpointHost: parsed.endpointHost,
    endpointPort: parsed.endpointPort,
    setconf: parsed.setconf,
  };
}

export async function awgConfigExists(): Promise<boolean> {
  const row = await db.amneziaWgConfig.findUnique({
    where: { id: CONFIG_ID },
    select: { id: true },
  });
  return Boolean(row);
}

export async function getAwgPublicStatus(): Promise<AwgPublicStatus> {
  const row = await db.amneziaWgConfig.findUnique({ where: { id: CONFIG_ID } });
  if (!row) {
    return {
      configured: false,
      enabled: false,
      leader: awgLeaderHeld(),
      up: false,
      handshakeAgeSec: null,
      address: null,
      endpoint: null,
      allowedIps: null,
      updatedAt: null,
      error: null,
    };
  }

  let helper: AwgHelperStatus | null = null;
  let helperError: string | null = null;
  const readHelper = async () => {
    try {
      helper = await awgHelperRequest<AwgHelperStatus>({ cmd: "status" }, 3000);
      helperError = null;
    } catch (error) {
      helperError = error instanceof Error ? error.message : "AmneziaWG helper failed";
    }
  };
  await readHelper();

  let leader = awgLeaderHeld();
  if (row.enabled && !leader) {
    leader = await ensureAwgLeaderLock();
    if (leader && !helper?.up) {
      try {
        await restoreAwgOnStartup();
      } catch (error) {
        log.warn(
          { error: error instanceof Error ? error.message : String(error) },
          "AmneziaWG restore after taking the lock failed",
        );
      }
      await readHelper();
    }
  }

  return {
    configured: true,
    enabled: row.enabled,
    leader,
    up: Boolean(helper?.up),
    handshakeAgeSec: handshakeAge(helper?.latestHandshake ?? null),
    address: row.address,
    endpoint: `${row.endpointHost}:${row.endpointPort}`,
    allowedIps: row.allowedIps,
    updatedAt: row.updatedAt.toISOString(),
    error: helper?.error ?? helperError,
  };
}

export async function saveAwgConfig(raw: string, userId: string): Promise<void> {
  const parsed = parseAmneziaWgConf(raw);
  const encrypted = encryptUtf8(JSON.stringify({ setconf: parsed.setconf } satisfies StoredSecret));

  await awgGate.exclusive(async () => {
    await requireLeader();
    await db.amneziaWgConfig.upsert({
      where: { id: CONFIG_ID },
      create: {
        id: CONFIG_ID,
        address: parsed.address,
        endpointHost: parsed.endpointHost,
        endpointPort: parsed.endpointPort,
        allowedIps: parsed.allowedIps,
        peerPublicKey: parsed.peerPublicKey,
        mtu: parsed.mtu,
        keepalive: parsed.keepalive,
        enabled: true,
        ...encrypted,
      },
      update: {
        address: parsed.address,
        endpointHost: parsed.endpointHost,
        endpointPort: parsed.endpointPort,
        allowedIps: parsed.allowedIps,
        peerPublicKey: parsed.peerPublicKey,
        mtu: parsed.mtu,
        keepalive: parsed.keepalive,
        enabled: true,
        ...encrypted,
      },
    });
    try {
      await awgHelperRequest({ cmd: "apply", ...applyPayload(parsed) }, 30_000);
      await reconcileAwgRoutesUnlocked();
    } catch (error) {
      await db.amneziaWgConfig.update({
        where: { id: CONFIG_ID },
        data: { enabled: false },
      });
      throw error;
    }
  });

  await createAuditEvent({
    userId,
    action: "AWG_CONFIG_APPLIED",
    entityType: "amneziawg",
    entityId: CONFIG_ID,
    metadata: { endpoint: `${parsed.endpointHost}:${parsed.endpointPort}` },
  });
}

export async function setAwgEnabled(enabled: boolean, userId: string): Promise<void> {
  await awgGate.exclusive(async () => {
    await requireLeader();
    const row = await db.amneziaWgConfig.findUnique({ where: { id: CONFIG_ID } });
    if (!row) {
      throw new Error("Upload an AmneziaWG config first");
    }
    if (!enabled) {
      await awgHelperRequest({ cmd: "down" });
      await db.amneziaWgConfig.update({ where: { id: CONFIG_ID }, data: { enabled: false } });
      return;
    }

    const secret = JSON.parse(
      decryptUtf8({
        encryptedData: row.encryptedData,
        iv: row.iv,
        authTag: row.authTag,
        keyVersion: row.keyVersion,
      }),
    ) as StoredSecret;
    await db.amneziaWgConfig.update({ where: { id: CONFIG_ID }, data: { enabled: true } });
    try {
      await awgHelperRequest(
        {
          cmd: "apply",
          address: row.address,
          mtu: row.mtu,
          endpointHost: row.endpointHost,
          endpointPort: row.endpointPort,
          setconf: secret.setconf,
        },
        30_000,
      );
      await reconcileAwgRoutesUnlocked();
    } catch (error) {
      await db.amneziaWgConfig.update({ where: { id: CONFIG_ID }, data: { enabled: false } });
      throw error;
    }
  });

  await createAuditEvent({
    userId,
    action: enabled ? "AWG_CONFIG_APPLIED" : "AWG_DISCONNECTED",
    entityType: "amneziawg",
    entityId: CONFIG_ID,
    metadata: { enabled },
  });
}

export async function deleteAwgConfig(userId: string): Promise<void> {
  await awgGate.exclusive(async () => {
    await requireLeader();
    await awgHelperRequest({ cmd: "down" }).catch((error) => {
      if (error instanceof AwgHelperError) {
        return;
      }
      throw error;
    });
    await db.amneziaWgConfig.deleteMany({ where: { id: CONFIG_ID } });
  });

  await createAuditEvent({
    userId,
    action: "AWG_CONFIG_DELETED",
    entityType: "amneziawg",
    entityId: CONFIG_ID,
  });
}

export async function reconcileAwgRoutes(): Promise<void> {
  await awgGate.exclusive(() => reconcileAwgRoutesUnlocked());
}

export async function reconcileAwgRoutesUnlocked(): Promise<void> {
  const row = await db.amneziaWgConfig.findUnique({ where: { id: CONFIG_ID } });
  if (!row?.enabled) {
    return;
  }

  const servers = await db.server.findMany({
    where: { useAwg: true },
    select: { host: true },
  });
  const hosts = new Map<string, string>();
  for (const server of servers) {
    hosts.set(server.host.toLowerCase(), server.host);
  }

  const ips: string[] = [];
  for (const host of hosts.values()) {
    try {
      ips.push(await resolveAwgIp(host, row));
    } catch (error) {
      log.warn(
        { host, error: error instanceof Error ? error.message : String(error) },
        "Skipped AmneziaWG route",
      );
    }
  }

  await awgHelperRequest({ cmd: "sync-routes", ips });
}

export async function restoreAwgOnStartup(): Promise<void> {
  const row = await db.amneziaWgConfig.findUnique({ where: { id: CONFIG_ID } });
  if (!row?.enabled) {
    return;
  }
  const leader = await ensureAwgLeaderLock();
  if (!leader) {
    log.warn("AmneziaWG tunnel left down because another instance holds it");
    return;
  }

  const secret = JSON.parse(
    decryptUtf8({
      encryptedData: row.encryptedData,
      iv: row.iv,
      authTag: row.authTag,
      keyVersion: row.keyVersion,
    }),
  ) as StoredSecret;

  await awgGate.exclusive(async () => {
    await awgHelperRequest(
      {
        cmd: "apply",
        address: row.address,
        mtu: row.mtu,
        endpointHost: row.endpointHost,
        endpointPort: row.endpointPort,
        setconf: secret.setconf,
      },
      30_000,
    );
    await reconcileAwgRoutesUnlocked();
  });
}
