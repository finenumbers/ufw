import { z } from "zod";

import { validateRuleCoreForUfw } from "@/lib/ufw/commands";
import type { RuleCore } from "@/types/rule";

export const importRuleRowSchema = z.object({
  action: z.enum(["ALLOW", "DENY", "REJECT", "LIMIT"]),
  direction: z.enum(["IN", "OUT", "ROUTE"]).optional(),
  interface: z.string().optional(),
  protocol: z.enum(["TCP", "UDP", "ICMP", "ANY"]).optional(),
  fromAddress: z.string().optional(),
  fromPort: z.string().optional(),
  toAddress: z.string().optional(),
  toPort: z.string().optional(),
  appName: z.string().optional(),
  logMode: z.enum(["NONE", "LOG", "LOG_ALL"]).optional(),
  ruleComment: z.string().optional(),
  ipv6: z.boolean().optional(),
  group: z.string().optional(),
  name: z.string().optional(),
  notes: z.string().optional(),
});

export type ImportRuleRow = z.infer<typeof importRuleRowSchema>;

function toRuleCore(row: ImportRuleRow): RuleCore {
  return {
    action: row.action,
    direction: row.direction ?? null,
    interface: row.interface ?? null,
    protocol: row.protocol ?? null,
    fromAddress: row.fromAddress ?? null,
    fromPort: row.fromPort ?? null,
    toAddress: row.toAddress ?? null,
    toPort: row.toPort ?? null,
    appName: row.appName ?? null,
    logMode: row.logMode ?? "NONE",
    ruleComment: row.ruleComment ?? null,
    ipv6: row.ipv6 ?? false,
  };
}

export function validateImportedRuleRows(rows: ImportRuleRow[]): string | null {
  for (let index = 0; index < rows.length; index += 1) {
    const error = validateRuleCoreForUfw(toRuleCore(rows[index]!));
    if (error) {
      return `Row ${index + 1}: ${error}`;
    }
  }

  return null;
}
