import { isPingableAddress } from "@/lib/reachability/ping";

const IPV4_PATTERN =
  /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d?\d)(?:\.(?:25[0-5]|2[0-4]\d|[01]?\d?\d)){3})$/;

const BLOCKED_NAMES = new Set(["localhost", "localhost.localdomain", "metadata.google.internal"]);

export type ProbeTarget =
  | { kind: "skip" }
  | { kind: "unresolved" }
  | { kind: "ip"; ip: string };

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) {
    return null;
  }

  let value = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) {
      return null;
    }
    const octet = Number(part);
    if (!Number.isInteger(octet) || octet < 0 || octet > 255) {
      return null;
    }
    value = (value << 8) + octet;
  }

  return value >>> 0;
}

function isLiteralIp(host: string): boolean {
  return IPV4_PATTERN.test(host) || host.includes(":");
}

/** Stored servers may be private or CGNAT. Block only destinations that must not be probed. */
export function isUnsafeProbeAddress(ip: string): boolean {
  const trimmed = ip.trim().toLowerCase();
  if (!trimmed || BLOCKED_NAMES.has(trimmed)) {
    return true;
  }

  const ipv4 = ipv4ToInt(trimmed);
  if (ipv4 != null) {
    const unsafeRanges: Array<[number, number]> = [
      [ipv4ToInt("0.0.0.0")!, ipv4ToInt("0.255.255.255")!],
      [ipv4ToInt("127.0.0.0")!, ipv4ToInt("127.255.255.255")!],
      [ipv4ToInt("169.254.0.0")!, ipv4ToInt("169.254.255.255")!],
      [ipv4ToInt("224.0.0.0")!, ipv4ToInt("255.255.255.255")!],
    ];
    return unsafeRanges.some(([start, end]) => ipv4 >= start && ipv4 <= end);
  }

  if (!trimmed.includes(":")) {
    return false;
  }

  return (
    trimmed === "::1" ||
    trimmed === "0:0:0:0:0:0:0:1" ||
    trimmed.startsWith("fe80:") ||
    trimmed.startsWith("ff")
  );
}

function isSafeHostname(host: string): boolean {
  if (!host || host.length > 253 || host.startsWith("-") || host.endsWith(".")) {
    return false;
  }

  return /^[a-z0-9.-]+$/i.test(host) && !BLOCKED_NAMES.has(host.toLowerCase());
}

export async function resolveProbeTarget(
  host: string,
  lookup: (hostname: string) => Promise<string>,
): Promise<ProbeTarget> {
  const trimmed = host.trim();
  if (!isSafeHostname(trimmed) && !isLiteralIp(trimmed)) {
    return { kind: "skip" };
  }

  if (isUnsafeProbeAddress(trimmed)) {
    return { kind: "skip" };
  }

  if (isLiteralIp(trimmed)) {
    if (!isPingableAddress(trimmed)) {
      return { kind: "skip" };
    }
    return { kind: "ip", ip: trimmed };
  }

  if (!isSafeHostname(trimmed)) {
    return { kind: "skip" };
  }

  try {
    const address = (await lookup(trimmed)).trim();
    if (isUnsafeProbeAddress(address) || !isPingableAddress(address)) {
      return { kind: "skip" };
    }
    return { kind: "ip", ip: address };
  } catch {
    return { kind: "unresolved" };
  }
}
