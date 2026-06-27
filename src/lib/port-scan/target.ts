import dns from "node:dns/promises";

import { validateResolvedIp, validateSshHost } from "@/lib/validations/ssh-host";

export type ResolvedScanTarget = {
  host: string;
  ip: string;
};

const IPV4_PATTERN =
  /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d?\d)(?:\.(?:25[0-5]|2[0-4]\d|[01]?\d?\d)){3})$/;

export async function resolveScanTarget(host: string): Promise<ResolvedScanTarget> {
  const trimmed = host.trim();
  const validationError = validateSshHost(trimmed);
  if (validationError) {
    throw new Error(validationError);
  }

  if (IPV4_PATTERN.test(trimmed)) {
    const resolvedError = validateResolvedIp(trimmed);
    if (resolvedError) {
      throw new Error(resolvedError);
    }

    return { host: trimmed, ip: trimmed };
  }

  try {
    const result = await dns.lookup(trimmed, { family: 4 });
    const resolvedError = validateResolvedIp(result.address);
    if (resolvedError) {
      throw new Error(resolvedError);
    }

    return { host: trimmed, ip: result.address };
  } catch (error) {
    if (error instanceof Error && error.message.includes("not allowed")) {
      throw error;
    }

    const message =
      error instanceof Error ? error.message : "DNS lookup failed";
    throw new Error(`Failed to resolve scan target "${trimmed}": ${message}`);
  }
}
