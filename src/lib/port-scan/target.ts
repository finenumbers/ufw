import dns from "node:dns/promises";

import { validateSshHost } from "@/lib/validations/ssh-host";

export type ResolvedScanTarget = {
  host: string;
  ip: string | null;
};

export async function resolveScanTarget(host: string): Promise<ResolvedScanTarget> {
  const trimmed = host.trim();
  const validationError = validateSshHost(trimmed);
  if (validationError) {
    throw new Error(validationError);
  }

  const ipv4Pattern =
    /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d?\d)(?:\.(?:25[0-5]|2[0-4]\d|[01]?\d?\d)){3})$/;

  if (ipv4Pattern.test(trimmed)) {
    return { host: trimmed, ip: trimmed };
  }

  try {
    const result = await dns.lookup(trimmed, { family: 4 });
    return { host: trimmed, ip: result.address };
  } catch {
    return { host: trimmed, ip: null };
  }
}
