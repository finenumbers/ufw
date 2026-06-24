import type { LogMode, RuleAction, RuleDirection, RuleProtocol } from "@prisma/client";

import type { RuleCore } from "@/types/rule";

import { UfwRuleValidationError } from "@/lib/ufw/commands";
import { ANYWHERE, normalizeAddress } from "@/lib/ufw/types";

const ALLOWED_ACTIONS = new Set<RuleAction>(["ALLOW", "DENY", "REJECT", "LIMIT"]);
const ALLOWED_DIRECTIONS = new Set<RuleDirection>(["IN", "OUT", "ROUTE"]);
const ALLOWED_PROTOCOLS = new Set<RuleProtocol>(["TCP", "UDP", "ICMP", "ANY"]);
const ALLOWED_LOG_MODES = new Set<LogMode>(["NONE", "LOG", "LOG_ALL"]);

const SHELL_METACHAR_PATTERN = /[;`$|\r\n&<>]/;

const INTERFACE_PATTERN = /^[a-zA-Z0-9._-]+$/;
const PORT_PATTERN = /^\d+(:\d+)?(?:,\d+(?::\d+)?)*$/;
const APP_NAME_PATTERN = /^[a-zA-Z0-9._ -]+$/;
const IPV4_CIDR_PATTERN =
  /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d?\d)(?:\.(?:25[0-5]|2[0-4]\d|[01]?\d?\d)){3})(?:\/(?:[0-9]|[12]\d|3[0-2]))?$/;
const IPV6_CIDR_PATTERN =
  /^[0-9a-f:]+(?:\/(?:[0-9]{1,3}|12[0-8]))?$/i;

function reject(field: string, message: string): never {
  throw new UfwRuleValidationError(`${field}: ${message}`);
}

export function assertNoShellMetacharacters(
  value: string,
  field: string,
): void {
  if (SHELL_METACHAR_PATTERN.test(value)) {
    reject(field, "contains invalid shell characters");
  }
}

function assertAddress(value: string | null | undefined, field: string): void {
  if (!value) {
    return;
  }

  const normalized = normalizeAddress(value);
  if (!normalized || normalized === ANYWHERE) {
    return;
  }

  assertNoShellMetacharacters(normalized, field);

  if (IPV4_CIDR_PATTERN.test(normalized) || IPV6_CIDR_PATTERN.test(normalized)) {
    return;
  }

  reject(field, "must be a valid IPv4/IPv6 address or CIDR");
}

function assertPort(value: string | null | undefined, field: string): void {
  if (!value) {
    return;
  }

  const trimmed = value.trim();
  assertNoShellMetacharacters(trimmed, field);

  if (!PORT_PATTERN.test(trimmed)) {
    reject(field, "must be a port or port range (e.g. 80 or 8000:8010)");
  }
}

function assertInterface(value: string | null | undefined): void {
  if (!value) {
    return;
  }

  const trimmed = value.trim();
  assertNoShellMetacharacters(trimmed, "interface");

  if (!INTERFACE_PATTERN.test(trimmed)) {
    reject("interface", "must contain only letters, numbers, dots, underscores, and hyphens");
  }
}

function assertAppName(value: string | null | undefined): void {
  if (!value) {
    return;
  }

  const trimmed = value.trim();
  assertNoShellMetacharacters(trimmed, "appName");

  if (!APP_NAME_PATTERN.test(trimmed)) {
    reject("appName", "contains invalid characters");
  }
}

function assertRuleComment(value: string | null | undefined): void {
  if (!value) {
    return;
  }

  assertNoShellMetacharacters(value, "ruleComment");
}

function assertEnumValue<T extends string>(
  value: T | null | undefined,
  field: string,
  allowed: Set<T>,
  required = false,
): void {
  if (value == null || value === "") {
    if (required) {
      reject(field, "is required");
    }
    return;
  }

  if (!allowed.has(value)) {
    reject(field, "contains an invalid value");
  }
}

export function sanitizeRuleCoreForUfwCommand(core: RuleCore): void {
  assertEnumValue(core.action, "action", ALLOWED_ACTIONS, true);
  assertEnumValue(core.direction ?? null, "direction", ALLOWED_DIRECTIONS);
  assertEnumValue(core.protocol ?? null, "protocol", ALLOWED_PROTOCOLS);
  assertEnumValue(core.logMode, "logMode", ALLOWED_LOG_MODES, true);
  assertInterface(core.interface);
  assertAddress(core.fromAddress, "fromAddress");
  assertAddress(core.toAddress, "toAddress");
  assertPort(core.fromPort, "fromPort");
  assertPort(core.toPort, "toPort");
  assertAppName(core.appName);
  assertRuleComment(core.ruleComment);
}
