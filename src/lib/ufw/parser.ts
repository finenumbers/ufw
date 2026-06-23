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

const NUMBERED_RULE_REGEX =
  /^\[\s*(\d+)\]\s+(.+?)\s+(ALLOW|DENY|REJECT|LIMIT)(?:\s+(IN|OUT))?\s+(.+)$/i;

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

function parseDestinationColumn(value: string) {
  const cleaned = value.replace(/\s*\(v6\)\s*/gi, "").trim();

  if (cleaned.includes("/")) {
    const [first, second] = cleaned.split("/", 2);
    if (normalizeProtocol(second)) {
      return {
        toAddress: null as string | null,
        toPort: normalizePort(first),
        protocol: normalizeProtocol(second),
        appName: null as string | null,
        interface: null as string | null,
      };
    }
    return {
      toAddress: normalizeAddress(cleaned),
      toPort: null as string | null,
      protocol: null as ReturnType<typeof normalizeProtocol>,
      appName: null as string | null,
      interface: null as string | null,
    };
  }

  if (/^on\s+/i.test(cleaned)) {
    return {
      toAddress: null as string | null,
      toPort: null as string | null,
      protocol: null as ReturnType<typeof normalizeProtocol>,
      appName: null as string | null,
      interface: cleaned.replace(/^on\s+/i, "").trim(),
    };
  }

  if (cleaned.toLowerCase() === "anywhere") {
    return {
      toAddress: normalizeAddress("anywhere"),
      toPort: null as string | null,
      protocol: null as ReturnType<typeof normalizeProtocol>,
      appName: null as string | null,
      interface: null as string | null,
    };
  }

  return {
    toAddress: null as string | null,
    toPort: null as string | null,
    protocol: null as ReturnType<typeof normalizeProtocol>,
    appName: cleaned,
    interface: null as string | null,
  };
}

function parseSourceColumn(value: string) {
  const cleaned = value.replace(/\s*\(v6\)\s*/gi, "").trim();
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

  return { fromAddress, fromPort, toAddress, protocol };
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

  let content = trimmed;
  let number = ruleNumber;

  const numberedMatch = trimmed.match(NUMBERED_RULE_REGEX);
  if (numberedMatch) {
    number = parseInt(numberedMatch[1], 10);
    content = `${numberedMatch[2].trim()} ${numberedMatch[3]} ${numberedMatch[4] ?? "IN"} ${numberedMatch[5].trim()}`;
  }

  let ruleComment: string | null = null;
  const commentMatch = content.match(/\s+#\s*(.+)$/);
  if (commentMatch) {
    ruleComment = commentMatch[1].trim();
    content = content.slice(0, commentMatch.index).trim();
  }

  const ipv6 = content.toLowerCase().includes("(v6)");

  // UFW table format: TO ACTION [LOG|LOG-ALL] DIRECTION FROM
  const parts = content.split(/\s+/);
  if (parts.length < 3) return null;

  const destination = parts[0];
  const action = normalizeAction(parts[1]);

  let logMode = normalizeLogMode(null);
  let direction: NonNullable<ReturnType<typeof normalizeDirection>> = "IN";
  let sourceStart = 2;

  if (parts[2]?.toUpperCase() === "LOG" || parts[2]?.toUpperCase() === "LOG-ALL") {
    logMode = normalizeLogMode(parts[2]);
    sourceStart = 3;
  }

  const maybeDirection = normalizeDirection(parts[sourceStart]);
  if (maybeDirection) {
    direction = maybeDirection;
    sourceStart += 1;
  }

  if (parts.length <= sourceStart) return null;

  const source = parts.slice(sourceStart).join(" ");
  const destinationFields = parseDestinationColumn(destination);
  const sourceFields = parseSourceColumn(source);

  const core: RuleCore = {
    action,
    direction,
    interface: destinationFields.interface,
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
    ruleNumber: number,
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

  // Fallback: parse verbose-style lines if numbered table header was not found.
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
