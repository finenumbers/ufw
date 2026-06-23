import { withSshConnection, type SshConnectionConfig } from "@/lib/ssh/client";

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
        message: result.stderr || "SSH command failed",
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
    const message =
      error instanceof Error ? error.message : "Unknown SSH error";

    if (message.toLowerCase().includes("host key")) {
      return {
        success: false,
        message: "SSH host key verification failed. The server key may have changed.",
      };
    }

    return { success: false, message };
  }
}
