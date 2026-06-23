import { importRuleRowSchema, type ImportRuleRow } from "@/lib/validations/import";

function readString(raw: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = raw[key];
    if (value === undefined || value === null || value === "") {
      continue;
    }
    return String(value);
  }
  return undefined;
}

function readOptionalString(raw: Record<string, unknown>, ...keys: string[]): string | undefined {
  const value = readString(raw, ...keys);
  return value;
}

function readIpv6(raw: Record<string, unknown>): boolean | undefined {
  const value = raw.ipv6 ?? raw.IPv6;
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  return value === true || value === "true" || value === 1 || value === "1";
}

export function normalizeImportRow(raw: Record<string, unknown>): ImportRuleRow {
  const mapped = {
    action: readString(raw, "action", "Action") ?? "ALLOW",
    direction: readOptionalString(raw, "direction", "Direction"),
    interface: readOptionalString(raw, "interface", "Interface"),
    protocol: readOptionalString(raw, "protocol", "Protocol") as ImportRuleRow["protocol"],
    fromAddress: readOptionalString(raw, "fromAddress", "from", "From"),
    fromPort: readOptionalString(raw, "fromPort", "from port", "From Port"),
    toAddress: readOptionalString(raw, "toAddress", "to", "To"),
    toPort: readOptionalString(raw, "toPort", "port", "Port", "To Port"),
    appName: readOptionalString(raw, "appName", "app", "App"),
    logMode: readOptionalString(raw, "logMode", "log", "Log") as ImportRuleRow["logMode"],
    ruleComment: readOptionalString(raw, "ruleComment", "comment", "Comment"),
    ipv6: readIpv6(raw),
    group: readOptionalString(raw, "group", "Group"),
    name: readOptionalString(raw, "name", "Name"),
    notes: readOptionalString(raw, "notes", "Notes"),
  };

  return importRuleRowSchema.parse(mapped);
}
