import { buildUfwAddCommand, buildUfwDeleteCommand } from "@/lib/ufw/commands";
import {
  diffDesiredVsRemote,
  getDesiredOrderedRules,
  needsOrderResync,
  resolveRuleFingerprint,
  type DiffItem,
  type DiffResult,
} from "@/lib/ufw/diff";
import type { ApplyPlan, ApplyPlanItem } from "@/types/apply";
import type { RuleUiMetadata, UnifiedRuleRow } from "@/types/rule";
import type { ParsedRemoteRule } from "@/types/ufw";

function toPlanAfter(row: UnifiedRuleRow): {
  core: UnifiedRuleRow["core"];
  ui: RuleUiMetadata;
} {
  return {
    core: row.core,
    ui: {
      group: row.ui.group,
      name: row.ui.name,
      notes: row.ui.notes,
    },
  };
}

function collectRemoves(
  diff: DiffResult,
  desired: UnifiedRuleRow[],
  remote: ParsedRemoteRule[],
  orderResync: boolean,
): DiffItem[] {
  const desiredSet = new Set(
    getDesiredOrderedRules(desired).map((row) => resolveRuleFingerprint(row)),
  );
  const removes = [...diff.items.filter((item) => item.action === "REMOVE")];

  if (orderResync) {
    for (const rule of remote) {
      if (desiredSet.has(rule.fingerprint) && rule.ruleNumber != null) {
        removes.push({
          action: "REMOVE",
          fingerprint: rule.fingerprint,
          before: { core: rule.core, ui: {} },
          remoteRuleNumber: rule.ruleNumber,
        });
      }
    }
  }

  const byRuleNumber = new Map<number, DiffItem>();
  for (const item of removes) {
    if (item.remoteRuleNumber != null) {
      byRuleNumber.set(item.remoteRuleNumber, item);
    }
  }

  return [...byRuleNumber.values()].sort(
    (left, right) => (right.remoteRuleNumber ?? 0) - (left.remoteRuleNumber ?? 0),
  );
}

export function buildApplyPlan(
  diff: DiffResult,
  desired: UnifiedRuleRow[],
  remote: ParsedRemoteRule[],
): ApplyPlan {
  const desiredOrdered = getDesiredOrderedRules(desired);
  const remoteMap = new Map(remote.map((rule) => [rule.fingerprint, rule]));
  const orderResync = needsOrderResync(desired, remote);
  const removes = collectRemoves(diff, desired, remote, orderResync);

  const items: ApplyPlanItem[] = [];
  let sortOrder = 0;

  for (const item of removes) {
    items.push({
      action: "REMOVE",
      fingerprint: item.fingerprint,
      before: item.before,
      remoteCommand: item.remoteRuleNumber
        ? buildUfwDeleteCommand(item.remoteRuleNumber)
        : undefined,
      sortOrder: sortOrder++,
    });
  }

  if (orderResync) {
    for (const row of desiredOrdered) {
      const fingerprint = resolveRuleFingerprint(row);
      items.push({
        action: remoteMap.has(fingerprint) ? "UPDATE" : "ADD",
        fingerprint,
        after: toPlanAfter(row),
        remoteCommand: buildUfwAddCommand(row.core),
        sortOrder: sortOrder++,
      });
    }
  } else {
    for (const item of diff.items.filter((entry) => entry.action === "ADD")) {
      const row = desiredOrdered.find(
        (candidate) => resolveRuleFingerprint(candidate) === item.fingerprint,
      );
      if (!row) continue;

      items.push({
        action: "ADD",
        fingerprint: item.fingerprint,
        after: item.after ?? toPlanAfter(row),
        remoteCommand: buildUfwAddCommand(row.core),
        sortOrder: sortOrder++,
      });
    }
  }

  const permanentRemoveCount = diff.items.filter((item) => item.action === "REMOVE").length;
  const addCount = orderResync
    ? desiredOrdered.filter((row) => !remoteMap.has(resolveRuleFingerprint(row))).length
    : diff.items.filter((item) => item.action === "ADD").length;
  const updateCount = orderResync
    ? desiredOrdered.filter((row) => remoteMap.has(resolveRuleFingerprint(row))).length
    : 0;

  return {
    items,
    summary: {
      addCount,
      removeCount: permanentRemoveCount,
      updateCount,
      orderResync,
    },
  };
}

export function hasApplyChanges(plan: ApplyPlan): boolean {
  return plan.items.length > 0;
}

export function rebuildApplyPlanAtConfirm(
  desired: UnifiedRuleRow[],
  remote: ParsedRemoteRule[],
): ApplyPlan {
  const diff = diffDesiredVsRemote(desired, remote);
  return buildApplyPlan(diff, desired, remote);
}

export function revalidateRemoveCommands(
  items: ApplyPlanItem[],
  remote: ParsedRemoteRule[],
): ApplyPlanItem[] {
  const remoteByFingerprint = new Map(
    remote.map((rule) => [rule.fingerprint, rule]),
  );

  return items.map((item) => {
    if (item.action !== "REMOVE") {
      return item;
    }

    const remoteRule = remoteByFingerprint.get(item.fingerprint);
    if (remoteRule?.ruleNumber == null) {
      return { ...item, remoteCommand: undefined };
    }

    return {
      ...item,
      remoteCommand: buildUfwDeleteCommand(remoteRule.ruleNumber),
    };
  });
}
