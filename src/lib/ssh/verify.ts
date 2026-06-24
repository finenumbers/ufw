import { withSshConnection, type SshConnectionConfig } from "@/lib/ssh/client";
import {
  sanitizeSshClientError,
  sanitizeSshCommandError,
} from "@/lib/errors/sanitize";

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
    return { success: false, message: sanitizeSshClientError(error) };
  }
}
