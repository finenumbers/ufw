const IPV4_PATTERN =
  /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d?\d)(?:\.(?:25[0-5]|2[0-4]\d|[01]?\d?\d)){3})$/;

const BLOCKED_NAMES = new Set(["localhost", "localhost.localdomain", "metadata.google.internal"]);

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
function isUnsafeProbeAddress(ip: string): boolean {
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

/** Skip addresses ping must not be aimed at. Ordinary hostnames are probed as stored. */
export function shouldSkipPingHost(host: string): boolean {
  const trimmed = host.trim();
  if (!trimmed || trimmed.length > 253 || trimmed.startsWith("-") || trimmed.includes("%") || /\s/.test(trimmed)) {
    return true;
  }

  if (BLOCKED_NAMES.has(trimmed.toLowerCase())) {
    return true;
  }

  if (isLiteralIp(trimmed)) {
    return isUnsafeProbeAddress(trimmed);
  }

  return false;
}
