import type { RuleAction, RuleDirection, RuleProtocol, LogMode } from "@prisma/client";

import type { UnifiedRuleRow } from "@/types/rule";

type SnapshotRuleRecord = {
  fingerprint: string;
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

export function buildPostApplyRuleRecords(
  snapshotRules: SnapshotRuleRecord[],
  desiredRows: UnifiedRuleRow[],
): Array<{
  fingerprint: string;
  sortOrder: number;
  core: UnifiedRuleRow["core"];
  ui: UnifiedRuleRow["ui"];
}> {
  const desiredByFingerprint = new Map(
    desiredRows.map((row) => [row.fingerprint, row]),
  );

  return snapshotRules.map((rule, index) => {
    const desiredRow = desiredByFingerprint.get(rule.fingerprint);

    return {
      fingerprint: rule.fingerprint,
      sortOrder: index,
      core: {
        action: rule.action,
        direction: rule.direction,
        interface: rule.interface,
        protocol: rule.protocol,
        fromAddress: rule.fromAddress,
        fromPort: rule.fromPort,
        toAddress: rule.toAddress,
        toPort: rule.toPort,
        appName: rule.appName,
        logMode: rule.logMode,
        ruleComment: rule.ruleComment,
        ipv6: rule.ipv6,
      },
      ui: {
        group: desiredRow?.ui.group ?? null,
        name: desiredRow?.ui.name ?? null,
        notes: desiredRow?.ui.notes ?? null,
      },
    };
  });
}

export function resolveApplyClaimError(updateCount: number): string | null {
  if (updateCount === 1) {
    return null;
  }

  return "Apply session is not pending or already claimed";
}
