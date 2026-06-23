import type { LogMode, RuleAction, RuleDirection, RuleProtocol } from "@prisma/client";

export type { RuleCore } from "@/types/rule";

export const ANYWHERE = "any";

export function normalizeAddress(value?: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim().toLowerCase();
  if (trimmed === "anywhere" || trimmed === "any" || trimmed === "all") {
    return ANYWHERE;
  }
  return trimmed;
}

export function normalizePort(value?: string | null): string | null {
  if (!value) return null;
  return value.trim().toLowerCase();
}

export function normalizeProtocol(value?: string | null): RuleProtocol | null {
  if (!value) return null;
  const upper = value.trim().toUpperCase();
  if (upper === "TCP" || upper === "UDP" || upper === "ICMP" || upper === "ANY") {
    return upper;
  }
  return null;
}

export function normalizeAction(value: string): RuleAction {
  const upper = value.trim().toUpperCase();
  if (upper === "ALLOW" || upper === "DENY" || upper === "REJECT" || upper === "LIMIT") {
    return upper;
  }
  return "ALLOW";
}

export function normalizeDirection(value?: string | null): RuleDirection | null {
  if (!value) return null;
  const upper = value.trim().toUpperCase();
  if (upper === "IN" || upper === "OUT" || upper === "ROUTE") {
    return upper;
  }
  return null;
}

export function normalizeLogMode(value?: string | null): LogMode {
  if (!value) return "NONE";
  const upper = value.trim().toUpperCase();
  if (upper === "LOG" || upper === "LOG_ALL") return upper;
  return "NONE";
}

export type CanonicalRuleCore = {
  action: RuleAction;
  direction: RuleDirection | null;
  interface: string | null;
  protocol: RuleProtocol | null;
  fromAddress: string | null;
  fromPort: string | null;
  toAddress: string | null;
  toPort: string | null;
  appName: string | null;
  logMode: LogMode;
  ruleComment: string | null;
  ipv6: boolean;
};

export function toCanonicalCore(
  core: import("@/types/rule").RuleCore,
): CanonicalRuleCore {
  return {
    action: core.action,
    direction: core.direction ?? null,
    interface: core.interface?.trim().toLowerCase() ?? null,
    protocol: core.protocol ?? null,
    fromAddress: normalizeAddress(core.fromAddress),
    fromPort: normalizePort(core.fromPort),
    toAddress: normalizeAddress(core.toAddress),
    toPort: normalizePort(core.toPort),
    appName: core.appName?.trim().toLowerCase() ?? null,
    logMode: core.logMode ?? "NONE",
    ruleComment: core.ruleComment?.trim() ?? null,
    ipv6: core.ipv6 ?? false,
  };
}
