import { resolveManagedHost, type HostLookup } from "@/lib/ssh/resolve-host";
import { readSshTargetPolicy } from "@/lib/ssh/target-policy";

export type ResolvedScanTarget = {
  host: string;
  ip: string;
};

export async function resolveScanTarget(
  host: string,
  lookup?: HostLookup,
): Promise<ResolvedScanTarget> {
  const trimmed = host.trim();

  try {
    const ip = await resolveManagedHost(trimmed, readSshTargetPolicy(), lookup);
    return { host: trimmed, ip };
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes("not allowed") ||
        error.message.startsWith("Host ") ||
        error.message.startsWith("Resolved IP ") ||
        error.message.startsWith("Docker host alias "))
    ) {
      throw error;
    }

    const message = error instanceof Error ? error.message : "DNS lookup failed";
    throw new Error(`Failed to resolve scan target "${trimmed}": ${message}`);
  }
}
