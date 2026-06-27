import { z } from "zod";

import { computeFingerprint } from "@/lib/ufw/fingerprint";
import type { UnifiedRuleRow } from "@/types/rule";

const ruleActionSchema = z.enum(["ALLOW", "DENY", "REJECT", "LIMIT"]);
const ruleDirectionSchema = z.enum(["IN", "OUT", "ROUTE"]);
const ruleProtocolSchema = z.enum(["TCP", "UDP", "ICMP", "ANY"]);
const logModeSchema = z.enum(["NONE", "LOG", "LOG_ALL"]);
const ruleOriginStateSchema = z.enum([
  "MATCHED",
  "REMOTE_ONLY",
  "LOCAL_ONLY",
  "DRAFT_ONLY",
  "CONFLICT",
]);

const ruleCoreSchema = z.object({
  action: ruleActionSchema,
  direction: ruleDirectionSchema.nullish(),
  interface: z.string().nullish(),
  protocol: ruleProtocolSchema.nullish(),
  fromAddress: z.string().nullish(),
  fromPort: z.string().nullish(),
  toAddress: z.string().nullish(),
  toPort: z.string().nullish(),
  appName: z.string().nullish(),
  logMode: logModeSchema,
  ruleComment: z.string().nullish(),
  ipv6: z.boolean(),
});

const unifiedRuleRowSchema = z.object({
  clientRowId: z.string().min(1),
  fingerprint: z.string().min(1),
  core: ruleCoreSchema,
  ui: z.object({
    group: z.string().nullish(),
    name: z.string().nullish(),
    notes: z.string().nullish(),
  }),
  originState: ruleOriginStateSchema,
  sources: z.object({
    remote: z.boolean(),
    local: z.boolean(),
    draft: z.boolean(),
  }),
  sortOrder: z.number().int().min(0),
  rawLine: z.string().nullish(),
  isDeleted: z.boolean().optional(),
  ufwRuleNumber: z.number().int().nullish().optional(),
  isPendingSave: z.boolean().optional(),
});

const unifiedRuleRowsSchema = z.array(unifiedRuleRowSchema);

function withComputedFingerprints(value: unknown): unknown {
  if (!Array.isArray(value)) {
    return value;
  }

  return value.map((row) => {
    if (!row || typeof row !== "object" || !("core" in row)) {
      return row;
    }

    const candidate = row as UnifiedRuleRow;
    if (!candidate.core || typeof candidate.core !== "object") {
      return row;
    }

    return { ...candidate, fingerprint: computeFingerprint(candidate.core) };
  });
}

export function parseUnifiedRuleRows(value: unknown): UnifiedRuleRow[] {
  const parsed = unifiedRuleRowsSchema.safeParse(withComputedFingerprints(value));
  if (!parsed.success) {
    const issue = parsed.error.errors[0];
    const path = issue?.path.join(".") || "rows";
    throw new Error(`Invalid rule data at ${path}: ${issue?.message ?? "validation failed"}`);
  }

  return parsed.data;
}
