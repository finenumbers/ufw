import dns from "node:dns/promises";

import { validateResolvedIp, validateSshHost } from "@/lib/validations/ssh-host";

const IPV4_PATTERN =
  /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d?\d)(?:\.(?:25[0-5]|2[0-4]\d|[01]?\d?\d)){3})$/;

function isLiteralIp(host: string): boolean {
  return IPV4_PATTERN.test(host) || host.includes(":");
}

/** Resolve hostnames to IPv4 and pin the address for SSH connect (blocks DNS rebinding). */
export async function resolveSshConnectHost(host: string): Promise<string> {
  const trimmed = host.trim();
  const validationError = validateSshHost(trimmed);
  if (validationError) {
    throw new Error(validationError);
  }

  if (isLiteralIp(trimmed)) {
    return trimmed;
  }

  const result = await dns.lookup(trimmed, { family: 4 });
  const resolvedError = validateResolvedIp(result.address);
  if (resolvedError) {
    throw new Error(resolvedError);
  }

  return result.address;
}
