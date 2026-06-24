import type { LogMode, RuleAction, RuleDirection } from "@prisma/client";
import type { RuleCore } from "@/types/rule";
import type { ParsedRemoteRule, UfwStatus } from "@/types/ufw";
import {
  normalizeAction,
  normalizeAddress,
  normalizeDirection,
  normalizeLogMode,
  normalizePort,
  normalizeProtocol,
} from "@/lib/ufw/types";
import { computeFingerprint } from "@/lib/ufw/fingerprint";

function parseUfwStatusOutput(rawStatus: string): UfwStatus {
  const lines = rawStatus.split("\n");
  const statusLine = lines.find((line) => line.startsWith("Status:"));
  const active = statusLine?.includes("active") ?? false;

  let defaultIncoming: string | undefined;
  let defaultOutgoing: string | undefined;

  for (const line of lines) {
    if (line.includes("Default:")) {
      const incomingMatch = line.match(/incoming '(\w+)'/i);
      const outgoingMatch = line.match(/outgoing '(\w+)'/i);
      defaultIncoming = incomingMatch?.[1];
      defaultOutgoing = outgoingMatch?.[1];
    }
  }

  return {
    installed: true,
    active,
    rawStatus,
    defaultIncoming,
    defaultOutgoing,
  };
}

function stripRuleNumber(trimmed: string): { number?: number; content: string } {
  const match = trimmed.match(/^\[\s*(\d+)\]\s*(.+)$/);
  if (match) {
    return { number: parseInt(match[1], 10), content: match[2].trim() };
  }
  return { content: trimmed };
}

function splitToActionFrom(content: string): {
  destination: string;
  action: RuleAction;
  tail: string;
} | null {
  const match = content.match(/^(.+)\s+(ALLOW|DENY|REJECT|LIMIT)\b(.*)$/i);
  if (!match) return null;

  return {
    destination: match[1].trim(),
    action: normalizeAction(match[2]),
    tail: match[3].trim(),
  };
}

function parseActionTail(tail: string): {
  logMode: LogMode;
  direction: RuleDirection;
  source: string;
} {
  let remaining = tail;
  let logMode: LogMode = "NONE";
  let direction: RuleDirection = "IN";

  const logMatch = remaining.match(/^(LOG(?:-ALL)?)\s+(.*)$/i);
  if (logMatch) {
    logMode = normalizeLogMode(logMatch[1]);
    remaining = logMatch[2].trim();
  }

  const dirMatch = remaining.match(/^(IN|OUT|FWD)\s+(.*)$/i);
  if (dirMatch) {
    direction = normalizeDirection(dirMatch[1]) ?? "IN";
    remaining = dirMatch[2].trim();
  }

  return {
    logMode,
    direction,
    source: remaining || normalizeAddress("anywhere")!,
  };
}

function isBarePortToken(value: string): boolean {
  return /^\d+(?::\d+)?(?:,\d+(?::\d+)?)*$/.test(value);
}

function looksLikeNetworkAddress(value: string): boolean {
  const v = value.trim().toLowerCase();
  if (
    /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d?\d)(?:\.(?:25[0-5]|2[0-4]\d|[01]?\d?\d)){3})(?:\/(?:[0-9]|[12]\d|3[0-2]))?$/.test(
      v,
    )
  ) {
    return true;
  }
  return /^[0-9a-f:]+(?:\/(?:[0-9]{1,3}|12[0-8]))?$/i.test(v);
}

function extractInterfaceSuffix(value: string): {
  body: string;
  interface: string | null;
} {
  const suffixMatch = value.match(/^(.+?)\s+on\s+(\S+)$/i);
  if (suffixMatch) {
    return { body: suffixMatch[1].trim(), interface: suffixMatch[2].trim() };
  }

  const prefixMatch = value.match(/^on\s+(\S+)$/i);
  if (prefixMatch) {
    return { body: "anywhere", interface: prefixMatch[1].trim() };
  }

  return { body: value.trim(), interface: null };
}

function extractAppAnnotation(value: string): {
  body: string;
  appName: string | null;
} {
  const match = value.match(/^(.+?)\s+\(([^)]+)\)\s*$/);
  if (match) {
    return { body: match[1].trim(), appName: match[2].trim() };
  }
  return { body: value.trim(), appName: null };
}

function parsePortProtocolToken(token: string): {
  port: string | null;
  protocol: ReturnType<typeof normalizeProtocol>;
} | null {
  if (token.includes("/")) {
    const slashIdx = token.lastIndexOf("/");
    const portPart = token.slice(0, slashIdx);
    const protoPart = token.slice(slashIdx + 1);
    if (normalizeProtocol(protoPart)) {
      return {
        port: normalizePort(portPart),
        protocol: normalizeProtocol(protoPart),
      };
    }
    return null;
  }

  if (token.includes(":")) {
    const colonIdx = token.indexOf(":");
    const first = token.slice(0, colonIdx);
    const second = token.slice(colonIdx + 1);
    if (/^\d/.test(first) && normalizeProtocol(second)) {
      return {
        port: normalizePort(first),
        protocol: normalizeProtocol(second),
      };
    }
  }

  return null;
}

function parseDestinationColumn(value: string) {
  let cleaned = value.replace(/\s*\(v6\)\s*/gi, "").trim();
  const { body: afterApp, appName: annotatedApp } = extractAppAnnotation(cleaned);
  cleaned = afterApp;

  const { body, interface: iface } = extractInterfaceSuffix(cleaned);
  cleaned = body;

  const portProto = parsePortProtocolToken(cleaned);
  if (portProto) {
    return {
      toAddress: null as string | null,
      toPort: portProto.port,
      protocol: portProto.protocol,
      appName: annotatedApp,
      interface: iface,
    };
  }

  if (cleaned.includes("/") && looksLikeNetworkAddress(cleaned)) {
    return {
      toAddress: normalizeAddress(cleaned),
      toPort: null as string | null,
      protocol: null as ReturnType<typeof normalizeProtocol>,
      appName: annotatedApp,
      interface: iface,
    };
  }

  if (cleaned.toLowerCase() === "anywhere") {
    return {
      toAddress: normalizeAddress("anywhere"),
      toPort: null as string | null,
      protocol: null as ReturnType<typeof normalizeProtocol>,
      appName: annotatedApp,
      interface: iface,
    };
  }

  if (isBarePortToken(cleaned)) {
    return {
      toAddress: null as string | null,
      toPort: normalizePort(cleaned),
      protocol: null as ReturnType<typeof normalizeProtocol>,
      appName: annotatedApp,
      interface: iface,
    };
  }

  if (looksLikeNetworkAddress(cleaned)) {
    return {
      toAddress: normalizeAddress(cleaned),
      toPort: null as string | null,
      protocol: null as ReturnType<typeof normalizeProtocol>,
      appName: annotatedApp,
      interface: iface,
    };
  }

  return {
    toAddress: null as string | null,
    toPort: null as string | null,
    protocol: null as ReturnType<typeof normalizeProtocol>,
    appName: annotatedApp ?? cleaned,
    interface: iface,
  };
}

function parseSourceColumn(value: string) {
  let cleaned = value.replace(/\s*\(v6\)\s*/gi, "").trim();
  const { body, interface: iface } = extractInterfaceSuffix(cleaned);
  cleaned = body;

  let fromAddress: string | null = null;
  let fromPort: string | null = null;
  let toAddress: string | null = null;
  let protocol: ReturnType<typeof normalizeProtocol> = null;

  const fromMatch = cleaned.match(/from\s+(\S+)/i);
  if (fromMatch) {
    fromAddress = normalizeAddress(fromMatch[1]);
    const toMatch = cleaned.match(/to\s+(\S+)/i);
    if (toMatch) toAddress = normalizeAddress(toMatch[1]);
    const portMatch = cleaned.match(/port\s+(\S+)/i);
    if (portMatch) fromPort = normalizePort(portMatch[1]);
    const protoMatch = cleaned.match(/proto\s+(\S+)/i);
    if (protoMatch) protocol = normalizeProtocol(protoMatch[1]);
  } else {
    fromAddress = normalizeAddress(cleaned);
  }

  return { fromAddress, fromPort, toAddress, protocol, interface: iface };
}

function resolveInterface(
  direction: RuleDirection,
  destinationFields: ReturnType<typeof parseDestinationColumn>,
  sourceFields: ReturnType<typeof parseSourceColumn>,
): string | null {
  if (direction === "OUT" || direction === "ROUTE") {
    return sourceFields.interface ?? destinationFields.interface;
  }
  return destinationFields.interface ?? sourceFields.interface;
}

function parseRuleLine(
  line: string,
  ruleNumber?: number,
): ParsedRemoteRule | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("Status:") || trimmed.startsWith("To ")) {
    return null;
  }
  if (trimmed.startsWith("--")) return null;

  const { number, content: numberedContent } = stripRuleNumber(trimmed);
  const numberResolved = ruleNumber ?? number;

  let ruleComment: string | null = null;
  let content = numberedContent;
  const commentMatch = content.match(/\s+#\s*(.+)$/);
  if (commentMatch) {
    ruleComment = commentMatch[1].trim();
    content = content.slice(0, commentMatch.index).trim();
  }

  const ipv6 = content.toLowerCase().includes("(v6)");

  const split = splitToActionFrom(content);
  if (!split) return null;

  const { logMode, direction, source } = parseActionTail(split.tail);
  const destinationFields = parseDestinationColumn(split.destination);
  const sourceFields = parseSourceColumn(source);

  const core: RuleCore = {
    action: split.action,
    direction,
    interface: resolveInterface(direction, destinationFields, sourceFields),
    protocol: destinationFields.protocol ?? sourceFields.protocol,
    fromAddress: sourceFields.fromAddress ?? normalizeAddress("anywhere"),
    fromPort: sourceFields.fromPort,
    toAddress:
      sourceFields.toAddress ??
      destinationFields.toAddress ??
      normalizeAddress("anywhere"),
    toPort: destinationFields.toPort,
    appName: destinationFields.appName,
    logMode,
    ruleComment,
    ipv6,
  };

  return {
    ruleNumber: numberResolved,
    rawLine: trimmed,
    core,
    fingerprint: computeFingerprint(core),
  };
}

export function parseNumberedRules(rawStatus: string): ParsedRemoteRule[] {
  const lines = rawStatus.split("\n");
  const rules: ParsedRemoteRule[] = [];
  let inRules = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("To ") && trimmed.includes("Action")) {
      inRules = true;
      continue;
    }
    if (!inRules) continue;

    const parsed = parseRuleLine(line);
    if (parsed) rules.push(parsed);
  }

  if (rules.length === 0) {
    for (const line of lines) {
      const parsed = parseRuleLine(line);
      if (parsed) rules.push(parsed);
    }
  }

  return rules;
}

export function parseUfwStatusAndRules(rawStatus: string): {
  installed: boolean;
  active: boolean;
  rules: ParsedRemoteRule[];
} {
  if (!rawStatus || rawStatus.toLowerCase().includes("command not found")) {
    return { installed: false, active: false, rules: [] };
  }

  if (!rawStatus.includes("Status:")) {
    return { installed: false, active: false, rules: [] };
  }

  const status = parseUfwStatusOutput(rawStatus);
  return {
    installed: true,
    active: status.active,
    rules: parseNumberedRules(rawStatus),
  };
}

export function parseVerboseStatus(rawStatus: string): {
  installed: boolean;
  active: boolean;
} {
  if (rawStatus.toLowerCase().includes("command not found")) {
    return { installed: false, active: false };
  }
  const status = parseUfwStatusOutput(rawStatus);
  return { installed: true, active: status.active };
}
