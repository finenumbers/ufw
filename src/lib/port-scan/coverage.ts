import type { RuleAction, RuleProtocol, UfwCoverage } from "@prisma/client";

type CoverageRule = {
  action: RuleAction;
  protocol: RuleProtocol | null;
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

function ruleCoversPort(rule: CoverageRule, port: number, protocol: string): boolean {
  if (rule.action !== "ALLOW") {
    return false;
  }

  if (!protocolMatches(rule.protocol, protocol)) {
    return false;
  }

  const toMatches = portInField(rule.toPort, port);
  const fromMatches = portInField(rule.fromPort, port);

  if (rule.toPort?.trim()) {
    return toMatches;
  }

  if (rule.fromPort?.trim()) {
    return fromMatches;
  }

  return true;
}

function ruleDeniesPort(rule: CoverageRule, port: number, protocol: string): boolean {
  if (rule.action !== "DENY" && rule.action !== "REJECT") {
    return false;
  }

  if (!protocolMatches(rule.protocol, protocol)) {
    return false;
  }

  return portInField(rule.toPort, port) || portInField(rule.fromPort, port);
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

  const allows = rules.some((rule) => ruleCoversPort(rule, port, protocol));
  if (allows) {
    return "ALLOWED";
  }

  const denies = rules.some((rule) => ruleDeniesPort(rule, port, protocol));
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
