import type { ApplyItemAction } from "@prisma/client";

import { computeFingerprint } from "@/lib/ufw/fingerprint";
import type { RuleCore, RuleUiMetadata, UnifiedRuleRow } from "@/types/rule";
import type { ParsedRemoteRule } from "@/types/ufw";

export type DiffItem = {
  action: ApplyItemAction;
  fingerprint: string;
  before?: { core: RuleCore; ui: RuleUiMetadata };
  after?: { core: RuleCore; ui: RuleUiMetadata };
  remoteRuleNumber?: number;
};

export type DiffResult = {
  items: DiffItem[];
  summary: {
    addCount: number;
    removeCount: number;
    updateCount: number;
  };
};

function toUi(row: UnifiedRuleRow): RuleUiMetadata {
  return {
    group: row.ui.group,
    name: row.ui.name,
    notes: row.ui.notes,
  };
}

export function resolveRuleFingerprint(row: UnifiedRuleRow): string {
  return row.fingerprint || computeFingerprint(row.core);
}

export function getDesiredOrderedRules(desired: UnifiedRuleRow[]): UnifiedRuleRow[] {
  return desired
    .filter((row) => !row.isDeleted)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getDesiredFingerprintOrder(desired: UnifiedRuleRow[]): string[] {
  return getDesiredOrderedRules(desired).map((row) => resolveRuleFingerprint(row));
}

export function getRemoteFingerprintOrder(remote: ParsedRemoteRule[]): string[] {
  return [...remote]
    .sort((a, b) => (a.ruleNumber ?? 0) - (b.ruleNumber ?? 0))
    .map((rule) => rule.fingerprint);
}

function sequencesEqual(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false;
  return left.every((value, index) => value === right[index]);
}

export function needsOrderResync(
  desired: UnifiedRuleRow[],
  remote: ParsedRemoteRule[],
): boolean {
  const desiredOrder = getDesiredFingerprintOrder(desired);
  if (desiredOrder.length === 0) return false;

  const desiredSet = new Set(desiredOrder);
  const remoteMap = new Map(remote.map((rule) => [rule.fingerprint, rule]));
  const projectedOrder = [
    ...getRemoteFingerprintOrder(remote).filter((fingerprint) => desiredSet.has(fingerprint)),
    ...desiredOrder.filter((fingerprint) => !remoteMap.has(fingerprint)),
  ];

  return !sequencesEqual(desiredOrder, projectedOrder);
}

export function diffDesiredVsRemote(
  desired: UnifiedRuleRow[],
  remote: ParsedRemoteRule[],
): DiffResult {
  const activeDesired = getDesiredOrderedRules(desired);
  const desiredMap = new Map(activeDesired.map((row) => [resolveRuleFingerprint(row), row]));
  const remoteMap = new Map(remote.map((rule) => [rule.fingerprint, rule]));

  const items: DiffItem[] = [];

  for (const [fingerprint, remoteRule] of remoteMap) {
    if (!desiredMap.has(fingerprint)) {
      items.push({
        action: "REMOVE",
        fingerprint,
        before: { core: remoteRule.core, ui: {} },
        remoteRuleNumber: remoteRule.ruleNumber,
      });
    }
  }

  for (const [fingerprint, desiredRow] of desiredMap) {
    const remoteRule = remoteMap.get(fingerprint);
    if (!remoteRule) {
      items.push({
        action: "ADD",
        fingerprint,
        after: { core: desiredRow.core, ui: toUi(desiredRow) },
      });
    }
  }

  const addCount = items.filter((item) => item.action === "ADD").length;
  const removeCount = items.filter((item) => item.action === "REMOVE").length;
  const updateCount = needsOrderResync(desired, remote)
    ? activeDesired.filter((row) => remoteMap.has(resolveRuleFingerprint(row))).length
    : 0;

  return {
    items,
    summary: {
      addCount,
      removeCount,
      updateCount,
    },
  };
}

export function mergeRulesByFingerprint(
  remote: UnifiedRuleRow[],
  local: UnifiedRuleRow[],
): UnifiedRuleRow[] {
  const map = new Map<string, UnifiedRuleRow>();

  for (const row of remote) {
    map.set(row.fingerprint, row);
  }

  for (const row of local) {
    const existing = map.get(row.fingerprint);
    if (existing) {
      map.set(row.fingerprint, {
        ...existing,
        ui: {
          group: row.ui.group ?? existing.ui.group,
          name: row.ui.name ?? existing.ui.name,
          notes: row.ui.notes ?? existing.ui.notes,
        },
        originState: "MATCHED",
        sources: { remote: true, local: true, draft: false },
      });
    } else {
      map.set(row.fingerprint, {
        ...row,
        originState: "LOCAL_ONLY",
        sources: { remote: false, local: true, draft: false },
      });
    }
  }

  for (const [fp, row] of map) {
    if (row.sources.remote && !row.sources.local) {
      map.set(fp, {
        ...row,
        originState: "REMOTE_ONLY",
        sources: { remote: true, local: false, draft: false },
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => a.sortOrder - b.sortOrder);
}
