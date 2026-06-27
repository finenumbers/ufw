import {
  runForServer,
  type RunForServerOptions,
} from "@/lib/queue/queue-registry";
import { withSshConnection } from "@/lib/ssh/client";
import {
  enableUfw,
  installUfw,
  loadUfwStatusAndRules,
} from "@/lib/ufw/apply";
import { collectInterfaceOptions, loadNetworkInterfaces } from "@/lib/ssh/interfaces";
import type { UfwDetectionResult } from "@/types/ufw";
import { getServerSshConfig } from "@/server/services/server.service";

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
      const { result, hostKeyFingerprint } = await withSshConnection(
        {
          host: config.host,
          port: config.port,
          username: config.username,
          password: config.privateKey ? undefined : config.password,
          privateKey: config.privateKey,
          passphrase: config.passphrase,
          expectedHostKeyFingerprint: config.expectedHostKeyFingerprint,
        },
        (client) => fn(client, config),
      );

      if (hostKeyFingerprint && !config.expectedHostKeyFingerprint) {
        const { db } = await import("@/lib/db");
        await db.server.update({
          where: { id: serverId },
          data: {
            sshHostKeyFingerprint: hostKeyFingerprint,
            sshHostKeyVerified: true,
          },
        });
      }

      return result;
    },
    options,
  );
}

export async function detectUfwState(
  serverId: string,
  options?: RunForServerOptions,
): Promise<UfwDetectionResult> {
  return runSshForServer(
    serverId,
    async (client, config) => {
      const loaded = await loadUfwStatusAndRules(client, config.password);
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
    },
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
