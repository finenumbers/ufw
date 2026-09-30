import { withSshConnection, type SshConnectionConfig } from "@/lib/ssh/client";
import {
  sanitizeSshClientError,
  sanitizeSshCommandError,
} from "@/lib/errors/sanitize";
import { dockerHostTimeoutMessage, readContainerRoutes } from "@/lib/ssh/docker-host-gateway";
import { isDockerHostAlias } from "@/lib/validations/ssh-host";

export type SshVerifyResult = {
  success: boolean;
  message: string;
  hostname?: string;
  hostKeyFingerprint?: string;
};

export async function verifySshConnection(
  config: SshConnectionConfig,
): Promise<SshVerifyResult> {
  try {
    const { result, hostKeyFingerprint } = await withSshConnection(
      config,
      async (client) => client.exec("echo ok && hostname"),
    );

    if (result.code !== 0 || !result.stdout.includes("ok")) {
      return {
        success: false,
        message: sanitizeSshCommandError(result.stderr),
      };
    }

    const hostname = result.stdout
      .split("\n")
      .map((line) => line.trim())
      .find((line) => line && line !== "ok");

    return {
      success: true,
      message: "Connection successful",
      hostname,
      hostKeyFingerprint: hostKeyFingerprint ?? config.expectedHostKeyFingerprint ?? undefined,
    };
  } catch (error) {
    if (isDockerHostAlias(config.host) && isConnectTimeout(error)) {
      const routes = await readContainerRoutes();
      return { success: false, message: dockerHostTimeoutMessage(routes) };
    }
    return { success: false, message: sanitizeSshClientError(error) };
  }
}

function isConnectTimeout(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  return message.includes("timed out") || message.includes("timeout");
}
