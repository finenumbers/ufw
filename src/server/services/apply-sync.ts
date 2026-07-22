import type { RuleAction, RuleDirection, RuleProtocol, LogMode } from "@prisma/client";

import { hasApplyChanges } from "@/lib/ufw/plan";
import type { ApplyPlan, ApplyPreviewResult } from "@/types/apply";
import type { UnifiedRuleRow } from "@/types/rule";
import type { UfwDetectionResult } from "@/types/ufw";

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

function detectionRulesToSnapshotRecords(rules: UfwDetectionResult["rules"]): SnapshotRuleRecord[] {
  return rules.map((rule) => ({
    fingerprint: rule.fingerprint,
    action: rule.core.action,
    direction: rule.core.direction ?? null,
    interface: rule.core.interface ?? null,
    protocol: rule.core.protocol ?? null,
    fromAddress: rule.core.fromAddress ?? null,
    fromPort: rule.core.fromPort ?? null,
    toAddress: rule.core.toAddress ?? null,
    toPort: rule.core.toPort ?? null,
    appName: rule.core.appName ?? null,
    logMode: rule.core.logMode,
    ruleComment: rule.core.ruleComment ?? null,
    ipv6: rule.core.ipv6,
  }));
}

export function detectionRulesToSnapshotRuleRows(rules: UfwDetectionResult["rules"]) {
  return rules.map((rule, index) => ({
    fingerprint: rule.fingerprint,
    sortOrder: index,
    action: rule.core.action,
    direction: rule.core.direction ?? null,
    interface: rule.core.interface ?? null,
    protocol: rule.core.protocol ?? null,
    fromAddress: rule.core.fromAddress ?? null,
    fromPort: rule.core.fromPort ?? null,
    toAddress: rule.core.toAddress ?? null,
    toPort: rule.core.toPort ?? null,
    appName: rule.core.appName ?? null,
    logMode: rule.core.logMode,
    ruleComment: rule.core.ruleComment ?? null,
    ipv6: rule.core.ipv6,
    rawLine: rule.rawLine,
  }));
}

export function buildPostApplyRuleRecordsFromDetection(
  detection: UfwDetectionResult,
  desiredRows: UnifiedRuleRow[],
) {
  return buildPostApplyRuleRecords(detectionRulesToSnapshotRecords(detection.rules), desiredRows);
}

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

type StoredPlanItem = {
  action: ApplyPlan["items"][number]["action"];
  fingerprint: string;
  sortOrder: number;
};

export function storedPlanItemsMatchPlan(
  storedItems: StoredPlanItem[],
  plan: ApplyPlan,
): boolean {
  if (storedItems.length !== plan.items.length) {
    return false;
  }

  for (let index = 0; index < plan.items.length; index += 1) {
    const stored = storedItems[index];
    const item = plan.items[index];
    if (
      stored.action !== item.action ||
      stored.fingerprint !== item.fingerprint ||
      stored.sortOrder !== item.sortOrder
    ) {
      return false;
    }
  }

  return true;
}

export function storedSummaryMatchesPlan(
  stored: ApplyPreviewResult["plan"]["summary"],
  plan: ApplyPlan,
): boolean {
  const previewHadUfw =
    stored.addCount + stored.removeCount + stored.updateCount > 0 || Boolean(stored.orderResync);
  const currentHasUfw = hasApplyChanges(plan);

  if (previewHadUfw !== currentHasUfw) {
    return false;
  }

  return (
    stored.addCount === plan.summary.addCount &&
    stored.removeCount === plan.summary.removeCount &&
    stored.updateCount === plan.summary.updateCount &&
    Boolean(stored.orderResync) === Boolean(plan.summary.orderResync)
  );
}

export function resolveApplyClaimError(updateCount: number): string | null {
  if (updateCount === 1) {
    return null;
  }

  return "Apply session is not pending or already claimed";
}
