import { awgGate } from "@/lib/awg/gate";
import {
  runForServer,
  type RunForServerOptions,
} from "@/lib/queue/queue-registry";
import { withSshConnection } from "@/lib/ssh/client";
import { steerAwgDestinationUnlocked } from "@/server/services/awg-steer";
import {
  enableUfw,
  installUfw,
  loadUfwStatusAndRules,
} from "@/lib/ufw/apply";
import { collectInterfaceOptions, loadNetworkInterfaces } from "@/lib/ssh/interfaces";
import type { UfwDetectionResult } from "@/types/ufw";
import { getServerSshConfig } from "@/server/services/server.service";

const AWG_ROUTE_REMOVED = "AmneziaWG route was removed for this node";

async function steeredSshTarget(serverId: string): Promise<{
  host: string;
  config: Awaited<ReturnType<typeof getServerSshConfig>>;
}> {
  const fresh = await getServerSshConfig(serverId);
  if (!fresh.useAwg) {
    throw new Error(AWG_ROUTE_REMOVED);
  }
  return {
    host: await steerAwgDestinationUnlocked(fresh.host),
    config: fresh,
  };
}

export async function runSshForServer<T>(
  serverId: string,
  fn: (
    client: import("@/lib/ssh/client").SshClient,
    config: Awaited<ReturnType<typeof getServerSshConfig>>,
  ) => Promise<T>,
  options?: RunForServerOptions,
): Promise<T> {
  return runForServer(
    serverId,
    async () => {
      const config = await getServerSshConfig(serverId);
      const connect = async () => {
        const steered = config.useAwg ? await steeredSshTarget(serverId) : null;
        const active = steered?.config ?? config;
        const connectHost = steered?.host ?? config.host;
        const { result, hostKeyFingerprint } = await withSshConnection(
          {
            host: connectHost,
            port: active.port,
            username: active.username,
            password: active.privateKey ? undefined : active.password,
            privateKey: active.privateKey,
            passphrase: active.passphrase,
            expectedHostKeyFingerprint: active.expectedHostKeyFingerprint,
            pinnedHost: active.useAwg,
          },
          (client) => fn(client, active),
        );

        await persistDiscoveredHostKey(
          serverId,
          hostKeyFingerprint,
          active.expectedHostKeyFingerprint,
        );

        return result;
      };

      return config.useAwg ? awgGate.shared(connect) : connect();
    },
    options,
  );
}

async function loadDetectionFromClient(
  client: import("@/lib/ssh/client").SshClient,
  password: string | undefined,
): Promise<UfwDetectionResult> {
  const loaded = await loadUfwStatusAndRules(client, password);
  const installed = loaded.rawStatus.includes("Status:");
  const rules = installed ? loaded.rules : [];
  const networkInterfaces = await loadNetworkInterfaces(client);
  const interfaces = collectInterfaceOptions(networkInterfaces, rules);

  return {
    installed,
    active: loaded.active,
    status: {
      installed,
      active: loaded.active,
      rawStatus: loaded.rawStatus,
    },
    rules,
    interfaces,
  };
}

async function persistDiscoveredHostKey(
  serverId: string,
  hostKeyFingerprint: string | null | undefined,
  expectedHostKeyFingerprint: string | null | undefined,
): Promise<void> {
  if (hostKeyFingerprint && !expectedHostKeyFingerprint) {
    const { db } = await import("@/lib/db");
    await db.server.update({
      where: { id: serverId },
      data: {
        sshHostKeyFingerprint: hostKeyFingerprint,
        sshHostKeyVerified: true,
      },
    });
  }
}

export async function detectUfwStateWithoutQueue(serverId: string): Promise<UfwDetectionResult> {
  const config = await getServerSshConfig(serverId);
  const connect = async () => {
    const steered = config.useAwg ? await steeredSshTarget(serverId) : null;
    const active = steered?.config ?? config;
    const connectHost = steered?.host ?? config.host;
    const { result, hostKeyFingerprint } = await withSshConnection(
      {
        host: connectHost,
        port: active.port,
        username: active.username,
        password: active.privateKey ? undefined : active.password,
        privateKey: active.privateKey,
        passphrase: active.passphrase,
        expectedHostKeyFingerprint: active.expectedHostKeyFingerprint,
        pinnedHost: active.useAwg,
      },
      (client) => loadDetectionFromClient(client, active.password),
    );
    await persistDiscoveredHostKey(
      serverId,
      hostKeyFingerprint,
      active.expectedHostKeyFingerprint,
    );
    return result;
  };

  return config.useAwg ? awgGate.shared(connect) : connect();
}

export async function detectUfwState(
  serverId: string,
  options?: RunForServerOptions,
): Promise<UfwDetectionResult> {
  return runSshForServer(
    serverId,
    (client, config) => loadDetectionFromClient(client, config.password),
    options,
  );
}

export async function remoteInstallUfw(
  serverId: string,
  options?: RunForServerOptions,
) {
  return runSshForServer(
    serverId,
    async (client, config) => installUfw(client, config.password),
    options,
  );
}

export async function remoteEnableUfw(
  serverId: string,
  options?: RunForServerOptions,
) {
  return runSshForServer(
    serverId,
    async (client, config) => enableUfw(client, config.password, config.port),
    options,
  );
}
