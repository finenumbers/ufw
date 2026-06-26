import type { RuleAction, RuleDirection, RuleProtocol, UfwCoverage } from "@prisma/client";

import { ANYWHERE, normalizeAddress } from "@/lib/ufw/types";

type CoverageRule = {
  action: RuleAction;
  direction?: RuleDirection | null;
  protocol: RuleProtocol | null;
  fromAddress?: string | null;
  toPort: string | null;
  fromPort: string | null;
};

function normalizeProtocol(value: string): string {
  return value.trim().toLowerCase();
}

function protocolMatches(ruleProtocol: RuleProtocol | null, scanProtocol: string): boolean {
  if (!ruleProtocol || ruleProtocol === "ANY") {
    return true;
  }
  return ruleProtocol.toLowerCase() === normalizeProtocol(scanProtocol);
}

function portInField(field: string | null, port: number): boolean {
  if (!field?.trim()) {
    return true;
  }

  const trimmed = field.trim();
  if (trimmed.includes(":")) {
    const [startRaw, endRaw] = trimmed.split(":");
    const start = Number.parseInt(startRaw, 10);
    const end = Number.parseInt(endRaw, 10);
    if (Number.isInteger(start) && Number.isInteger(end)) {
      return port >= start && port <= end;
    }
  }

  if (trimmed.includes(",")) {
    return trimmed.split(",").some((part) => portInField(part, port));
  }

  const exact = Number.parseInt(trimmed, 10);
  return Number.isInteger(exact) && exact === port;
}

function isPublicSource(fromAddress: string | null | undefined): boolean {
  return normalizeAddress(fromAddress) === ANYWHERE;
}

function isInboundDirection(direction: RuleDirection | null | undefined): boolean {
  return direction === "IN" || direction == null;
}

function isPermissiveAction(action: RuleAction): boolean {
  return action === "ALLOW" || action === "LIMIT";
}

/** External scan: port is covered only by inbound ALLOW/LIMIT from any source. */
function ruleCoversPortForExternal(rule: CoverageRule, port: number, protocol: string): boolean {
  if (!isPermissiveAction(rule.action)) {
    return false;
  }

  if (!isInboundDirection(rule.direction)) {
    return false;
  }

  if (!isPublicSource(rule.fromAddress)) {
    return false;
  }

  if (!protocolMatches(rule.protocol, protocol)) {
    return false;
  }

  if (rule.toPort?.trim()) {
    return portInField(rule.toPort, port);
  }

  return true;
}

function ruleDeniesPortForExternal(rule: CoverageRule, port: number, protocol: string): boolean {
  if (rule.action !== "DENY" && rule.action !== "REJECT") {
    return false;
  }

  if (!isInboundDirection(rule.direction)) {
    return false;
  }

  if (!isPublicSource(rule.fromAddress)) {
    return false;
  }

  if (!protocolMatches(rule.protocol, protocol)) {
    return false;
  }

  if (rule.toPort?.trim()) {
    return portInField(rule.toPort, port);
  }

  return true;
}

export function computeUfwCoverage(
  port: number,
  protocol: string,
  rules: CoverageRule[],
  options?: { ufwActive?: boolean },
): UfwCoverage {
  if (options?.ufwActive === false) {
    return "UNKNOWN";
  }

  if (rules.length === 0) {
    return "UNKNOWN";
  }

  const allows = rules.some((rule) => ruleCoversPortForExternal(rule, port, protocol));
  if (allows) {
    return "ALLOWED";
  }

  const denies = rules.some((rule) => ruleDeniesPortForExternal(rule, port, protocol));
  if (denies) {
    return "DENIED";
  }

  return "NOT_IN_UFW";
}

export function buildCoverageMap(
  openPorts: Array<{ port: number; protocol: string }>,
  rules: CoverageRule[],
  options?: { ufwActive?: boolean },
): Map<string, UfwCoverage> {
  const map = new Map<string, UfwCoverage>();

  for (const row of openPorts) {
    map.set(
      `${row.port}/${row.protocol}`,
      computeUfwCoverage(row.port, row.protocol, rules, options),
    );
  }

  return map;
}
