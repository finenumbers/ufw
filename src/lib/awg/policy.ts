const IPV4 =
  /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d?\d)(?:\.(?:25[0-5]|2[0-4]\d|[01]?\d?\d)){3})$/;

export const AWG_INTERFACE = "awg0";

export function isIpv4(value: string): boolean {
  return IPV4.test(value.trim());
}

export function ipv4ToInt(ip: string): number | null {
  if (!isIpv4(ip)) {
    return null;
  }
  const parts = ip.trim().split(".").map((part) => Number(part));
  return (((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0);
}

export function ipv4InCidr(ip: string, cidr: string): boolean {
  const [network, prefixRaw] = cidr.split("/");
  const prefix = prefixRaw === undefined ? 32 : Number(prefixRaw);
  const ipInt = ipv4ToInt(ip);
  const networkInt = network ? ipv4ToInt(network) : null;
  if (ipInt === null || networkInt === null || !Number.isInteger(prefix) || prefix < 0 || prefix > 32) {
    return false;
  }
  if (prefix === 0) {
    return true;
  }
  const mask = (0xffffffff << (32 - prefix)) >>> 0;
  return (ipInt & mask) === (networkInt & mask);
}

/** Addresses that must never be steered into awg0, even for an opted-in node. */
export function awgDestinationBlockReason(
  ip: string,
  options: {
    endpointIp?: string | null;
    tunnelAddress?: string | null;
    containerCidrs?: string[];
  } = {},
): string | null {
  const trimmed = ip.trim();
  const value = ipv4ToInt(trimmed);
  if (value === null) {
    return "AmneziaWG destinations must be IPv4";
  }

  const first = value >>> 24;
  if (first === 0 || first === 127 || first >= 224) {
    return "Resolved IP is not allowed";
  }
  if (first === 169 && ((value >>> 16) & 0xff) === 254) {
    return "Resolved IP is not allowed";
  }
  if (options.endpointIp && trimmed === options.endpointIp.trim()) {
    return "Use the node address inside the VPN, not the Amnezia endpoint";
  }
  if (options.tunnelAddress && trimmed === options.tunnelAddress.trim()) {
    return "Resolved IP is not allowed";
  }
  for (const cidr of options.containerCidrs ?? []) {
    if (ipv4InCidr(trimmed, cidr)) {
      return "Resolved IP is inside the container network";
    }
  }
  return null;
}

export function validateAwgHost(host: string): string | null {
  const trimmed = host.trim();
  if (!trimmed) {
    return "Host is required";
  }
  if (trimmed.length > 253) {
    return "Host is too long";
  }
  const normalized = trimmed.toLowerCase();
  if (
    normalized === "localhost" ||
    normalized === "localhost.localdomain" ||
    normalized === "metadata.google.internal" ||
    normalized === "host.docker.internal"
  ) {
    return "Host is not allowed";
  }
  if (trimmed.includes(":")) {
    return "AmneziaWG destinations must be IPv4";
  }
  if (isIpv4(trimmed)) {
    return awgDestinationBlockReason(trimmed);
  }
  if (!/^[a-z0-9.-]+$/i.test(trimmed) || trimmed.startsWith("-") || trimmed.endsWith("-")) {
    return "Host contains invalid characters";
  }
  if (normalized.endsWith(".local") || normalized.endsWith(".internal")) {
    return "Host is not allowed";
  }
  return null;
}

export function ipv4CoveredByAllowedIps(ip: string, allowedIps: string): boolean {
  const ranges = allowedIps
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  return ranges.some((cidr) => {
    if (cidr.includes(":")) {
      return false;
    }
    return ipv4InCidr(ip, cidr);
  });
}

export function routeDevice(routeGetOutput: string): string | null {
  const match = routeGetOutput.match(/\bdev\s+(\S+)/);
  return match?.[1] ?? null;
}

/** Refuse to dial unless the kernel will send this address into awg0. */
export function assertAwgConnectAllowed(tunnelUp: boolean, routeGetOutput: string): void {
  if (!tunnelUp) {
    throw new Error("AmneziaWG is down");
  }
  if (routeDevice(routeGetOutput) !== AWG_INTERFACE) {
    throw new Error("Refusing to connect outside AmneziaWG");
  }
}
