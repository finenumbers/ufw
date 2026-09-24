import { isPingableAddress } from "@/lib/reachability/ping";
import { validateResolvedIp, validateSshHost } from "@/lib/validations/ssh-host";

const IPV4_PATTERN =
  /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d?\d)(?:\.(?:25[0-5]|2[0-4]\d|[01]?\d?\d)){3})$/;

export type ProbeTarget =
  | { kind: "skip" }
  | { kind: "unresolved" }
  | { kind: "ip"; ip: string };

function isLiteralIp(host: string): boolean {
  return IPV4_PATTERN.test(host) || host.includes(":");
}

export async function resolveProbeTarget(
  host: string,
  lookup: (hostname: string) => Promise<string>,
): Promise<ProbeTarget> {
  const trimmed = host.trim();
  if (validateSshHost(trimmed)) {
    return { kind: "skip" };
  }

  if (isLiteralIp(trimmed)) {
    if (!isPingableAddress(trimmed)) {
      return { kind: "skip" };
    }
    return { kind: "ip", ip: trimmed };
  }

  try {
    const address = (await lookup(trimmed)).trim();
    if (validateResolvedIp(address) || !isPingableAddress(address)) {
      return { kind: "skip" };
    }
    return { kind: "ip", ip: address };
  } catch {
    return { kind: "unresolved" };
  }
}
