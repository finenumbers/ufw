import { isDisallowedExternalAddress } from "@/lib/validations/ssh-host";

const BLOCKED_NAMES = new Set(["localhost", "localhost.localdomain", "metadata.google.internal"]);

const IPV4_PATTERN =
  /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d?\d)(?:\.(?:25[0-5]|2[0-4]\d|[01]?\d?\d)){3})$/;

function isLiteralIpv4(host: string): boolean {
  return IPV4_PATTERN.test(host);
}

/** Public hostnames and public IPs only. Private and CGNAT literals stay inside the app. */
export function canQueryBlockCheckHost(host: string): boolean {
  const trimmed = host.trim();
  if (!trimmed || trimmed.length > 253 || /\s/.test(trimmed) || trimmed.includes("%")) {
    return false;
  }

  const normalized = trimmed.toLowerCase();
  if (BLOCKED_NAMES.has(normalized)) {
    return false;
  }

  if (trimmed.includes(":")) {
    if (!/^[0-9a-f:.]+$/i.test(trimmed)) {
      return false;
    }
    return !isDisallowedExternalAddress(trimmed);
  }

  if (isLiteralIpv4(trimmed)) {
    return !isDisallowedExternalAddress(trimmed);
  }

  if (!/^[a-z0-9.-]+$/i.test(trimmed) || trimmed.startsWith("-") || trimmed.endsWith(".")) {
    return false;
  }

  if (normalized.endsWith(".local") || normalized.endsWith(".internal") || normalized.includes("..")) {
    return false;
  }

  return true;
}

export function blockCheckHostKey(host: string): string {
  return host.trim().toLowerCase();
}
