import { sanitizeRuleCoreForUfwCommand } from "@/lib/ufw/sanitize";
import { ANYWHERE, normalizeAddress } from "@/lib/ufw/types";
import type { RuleCore, UnifiedRuleRow } from "@/types/rule";

export class UfwRuleValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UfwRuleValidationError";
  }
}

export function ipv6Wildcard(ipv6: boolean): string {
  return ipv6 ? "::/0" : "0.0.0.0/0";
}

export function isAnyAddress(address?: string | null): boolean {
  const normalized = normalizeAddress(address);
  return !normalized || normalized === ANYWHERE;
}

export function getSpecificAddress(address?: string | null): string | null {
  if (isAnyAddress(address)) return null;
  return normalizeAddress(address);
}

export function isIpv6Address(address: string): boolean {
  return address.includes(":");
}

export function resolveIpVersionForUfwCommand(core: RuleCore): boolean {
  const from = getSpecificAddress(core.fromAddress);
  const to = getSpecificAddress(core.toAddress);

  if (from) return isIpv6Address(from);
  if (to) return isIpv6Address(to);
  return core.ipv6;
}

export function validateRuleCoreForUfw(core: RuleCore): string | null {
  const from = getSpecificAddress(core.fromAddress);
  const to = getSpecificAddress(core.toAddress);

  if (from && to && isIpv6Address(from) !== isIpv6Address(to)) {
    return "From and To must use the same IP version (both IPv4 or both IPv6).";
  }

  if (from && isIpv6Address(from) !== core.ipv6) {
    return core.ipv6
      ? "From uses an IPv4 address. Set IPv6 to no or change From to an IPv6 address."
      : "From uses an IPv6 address. Set IPv6 to yes or change From to an IPv4 address.";
  }

  if (to && isIpv6Address(to) !== core.ipv6) {
    return core.ipv6
      ? "To uses an IPv4 address. Set IPv6 to no or change To to an IPv6 address."
      : "To uses an IPv6 address. Set IPv6 to yes or change To to an IPv4 address.";
  }

  return null;
}

export function validateRulesForUfwApply(rows: UnifiedRuleRow[]): string | null {
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    if (row.isDeleted) continue;

    const error = validateRuleCoreForUfw(row.core);
    if (error) {
      const label =
        row.ui.name?.trim() ||
        row.core.fromAddress ||
        row.core.toPort ||
        `row ${index + 1}`;
      return `Rule "${label}": ${error}`;
    }
  }

  return null;
}

export function syncIpv6FlagWithAddresses(core: RuleCore): RuleCore {
  const from = getSpecificAddress(core.fromAddress);
  const to = getSpecificAddress(core.toAddress);

  if (from) {
    return { ...core, ipv6: isIpv6Address(from) };
  }

  if (to) {
    return { ...core, ipv6: isIpv6Address(to) };
  }

  return core;
}

export function resolveAddressForUfwCommand(
  address: string | null | undefined,
  ipv6: boolean,
): string {
  if (isAnyAddress(address)) {
    return ipv6Wildcard(ipv6);
  }

  return normalizeAddress(address)!;
}

export function buildUfwAddCommand(core: RuleCore): string {
  sanitizeRuleCoreForUfwCommand(core);

  const validationError = validateRuleCoreForUfw(core);
  if (validationError) {
    throw new UfwRuleValidationError(validationError);
  }

  const ipv6 = resolveIpVersionForUfwCommand(core);
  const isRoute = core.direction === "ROUTE";
  const parts: string[] = ["ufw"];

  if (isRoute) {
    parts.push("route");
  }

  if (core.logMode === "LOG") {
    parts.push(core.action.toLowerCase(), "log");
  } else if (core.logMode === "LOG_ALL") {
    parts.push(core.action.toLowerCase(), "log-all");
  } else {
    parts.push(core.action.toLowerCase());
  }

  if (!isRoute && core.direction) {
    parts.push(core.direction.toLowerCase());
  }

  if (core.interface) {
    parts.push("on", core.interface);
  }

  parts.push("from", resolveAddressForUfwCommand(core.fromAddress, ipv6));

  if (core.fromPort) {
    parts.push("port", core.fromPort);
  }

  parts.push("to", resolveAddressForUfwCommand(core.toAddress, ipv6));

  if (core.toPort) {
    if (core.protocol) {
      parts.push("port", core.toPort, "proto", core.protocol.toLowerCase());
    } else {
      parts.push("port", core.toPort);
    }
  } else if (core.appName) {
    parts.push("app", `"${core.appName}"`);
  } else if (core.protocol && !core.toPort) {
    parts.push("proto", core.protocol.toLowerCase());
  }

  if (core.ruleComment) {
    parts.push("comment", `'${core.ruleComment.replace(/'/g, `'\\''`)}'`);
  }

  return parts.join(" ");
}

export function buildUfwDeleteCommand(ruleNumber: number): string {
  return `ufw --force delete ${ruleNumber}`;
}

export const UFW_COMMANDS = {
  checkInstalled:
    "([ -x /usr/sbin/ufw ] || [ -x /sbin/ufw ] || command -v ufw >/dev/null 2>&1) && echo installed || echo missing",
  version: "ufw version 2>&1",
  statusVerbose: "ufw status verbose 2>&1",
  statusNumbered: "ufw status numbered 2>&1",
  installDebian:
    "DEBIAN_FRONTEND=noninteractive apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y ufw",
  enable: "ufw --force enable",
  reload: "ufw reload",
};

export function buildAllowSshCommand(port: number): string {
  return `ufw allow ${port}/tcp`;
}
