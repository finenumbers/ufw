const BLOCKED_LITERAL_HOSTS = new Set([
  "localhost",
  "localhost.localdomain",
  "metadata.google.internal",
]);

const METADATA_IPV4 = "169.254.169.254";

function parseAllowedCidrs(): string[] {
  const raw = process.env.SSH_ALLOWED_CIDRS?.trim();
  if (!raw) {
    return [];
  }

  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

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

function isIpv4(ip: string): boolean {
  return ipv4ToInt(ip) != null;
}

function isIpv6(ip: string): boolean {
  return ip.includes(":") && /^[0-9a-f:.]+$/i.test(ip);
}

function extractIpv4FromMappedIpv6(ip: string): string | null {
  const normalized = ip.toLowerCase();

  if (normalized.startsWith("::ffff:")) {
    const suffix = normalized.slice("::ffff:".length);
    if (isIpv4(suffix)) {
      return suffix;
    }
  }

  const mappedMatch = normalized.match(/^0:0:0:0:0:ffff:([0-9.]+)$/);
  if (mappedMatch?.[1] && isIpv4(mappedMatch[1])) {
    return mappedMatch[1];
  }

  return null;
}

function isIpv4InCidr(ip: string, cidr: string): boolean {
  const [network, prefixRaw] = cidr.split("/");
  const prefix = prefixRaw ? Number(prefixRaw) : 32;
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) {
    return false;
  }

  const ipInt = ipv4ToInt(ip);
  const networkInt = ipv4ToInt(network);
  if (ipInt == null || networkInt == null) {
    return false;
  }

  const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
  return (ipInt & mask) === (networkInt & mask);
}

function isBlockedIpv4(ip: string): boolean {
  if (ip === METADATA_IPV4) {
    return true;
  }

  const ipInt = ipv4ToInt(ip);
  if (ipInt == null) {
    return true;
  }

  const blockedRanges: Array<[number, number]> = [
    [ipv4ToInt("0.0.0.0")!, ipv4ToInt("0.255.255.255")!],
    [ipv4ToInt("10.0.0.0")!, ipv4ToInt("10.255.255.255")!],
    [ipv4ToInt("127.0.0.0")!, ipv4ToInt("127.255.255.255")!],
    [ipv4ToInt("169.254.0.0")!, ipv4ToInt("169.254.255.255")!],
    [ipv4ToInt("172.16.0.0")!, ipv4ToInt("172.31.255.255")!],
    [ipv4ToInt("192.168.0.0")!, ipv4ToInt("192.168.255.255")!],
    [ipv4ToInt("100.64.0.0")!, ipv4ToInt("100.127.255.255")!],
  ];

  return blockedRanges.some(([start, end]) => ipInt >= start && ipInt <= end);
}

function isBlockedIpv6(ip: string): boolean {
  const normalized = ip.toLowerCase();

  if (normalized === "::1" || normalized === "0:0:0:0:0:0:0:1") {
    return true;
  }

  if (normalized.startsWith("fe80:")) {
    return true;
  }

  if (normalized.startsWith("fc") || normalized.startsWith("fd")) {
    return true;
  }

  return false;
}

function isAllowedByCidr(ip: string, allowedCidrs: string[]): boolean {
  if (allowedCidrs.length === 0) {
    return false;
  }

  return allowedCidrs.some((cidr) => isIpv4InCidr(ip, cidr));
}

/** Validate a resolved IP address against blocked ranges and optional allowlist. */
export function validateResolvedIp(ip: string): string | null {
  const trimmed = ip.trim();
  if (!trimmed) {
    return "Resolved IP is empty";
  }

  if (isIpv4(trimmed)) {
    const allowedCidrs = parseAllowedCidrs();
    if (isAllowedByCidr(trimmed, allowedCidrs)) {
      return null;
    }

    if (isBlockedIpv4(trimmed)) {
      return "Resolved IP is not allowed";
    }

    return null;
  }

  if (isIpv6(trimmed)) {
    const mappedIpv4 = extractIpv4FromMappedIpv6(trimmed);
    if (mappedIpv4) {
      const allowedCidrs = parseAllowedCidrs();
      if (isAllowedByCidr(mappedIpv4, allowedCidrs)) {
        return null;
      }

      if (isBlockedIpv4(mappedIpv4)) {
        return "Resolved IP is not allowed";
      }

      return null;
    }

    if (isBlockedIpv6(trimmed)) {
      return "Resolved IP is not allowed";
    }

    return null;
  }

  return "Resolved IP is not valid";
}

export function validateSshHost(host: string): string | null {
  const trimmed = host.trim();
  if (!trimmed) {
    return "Host is required";
  }

  if (trimmed.length > 253) {
    return "Host is too long";
  }

  const normalized = trimmed.toLowerCase();
  if (BLOCKED_LITERAL_HOSTS.has(normalized)) {
    return "Host is not allowed";
  }

  if (isIpv4(trimmed)) {
    const allowedCidrs = parseAllowedCidrs();
    if (isAllowedByCidr(trimmed, allowedCidrs)) {
      return null;
    }

    if (isBlockedIpv4(trimmed)) {
      return "Host IP is not allowed";
    }

    return null;
  }

  if (isIpv6(trimmed)) {
    const mappedIpv4 = extractIpv4FromMappedIpv6(trimmed);
    if (mappedIpv4) {
      const allowedCidrs = parseAllowedCidrs();
      if (isAllowedByCidr(mappedIpv4, allowedCidrs)) {
        return null;
      }

      if (isBlockedIpv4(mappedIpv4)) {
        return "Host IP is not allowed";
      }

      return null;
    }

    if (isBlockedIpv6(trimmed)) {
      return "Host IP is not allowed";
    }

    return null;
  }

  if (!/^[a-z0-9.-]+$/i.test(trimmed)) {
    return "Host contains invalid characters";
  }

  if (normalized.endsWith(".local") || normalized.endsWith(".internal")) {
    return "Host is not allowed";
  }

  return null;
}
