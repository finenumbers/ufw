import { getDesiredOrderedRules, resolveRuleFingerprint } from "@/lib/ufw/diff";
import type { RuleCore, UnifiedRuleRow } from "@/types/rule";

type PersistedRuleRecord = {
  fingerprint: string;
  sortOrder: number;
  action: RuleCore["action"];
  direction: RuleCore["direction"];
  interface: string | null;
  protocol: RuleCore["protocol"];
  fromAddress: string | null;
  fromPort: string | null;
  toAddress: string | null;
  toPort: string | null;
  appName: string | null;
  logMode: RuleCore["logMode"];
  ruleComment: string | null;
  ipv6: boolean;
  group: string | null;
  name: string | null;
  notes: string | null;
};

function normalizeUiValue(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function coreMatchesRecord(core: RuleCore, record: PersistedRuleRecord): boolean {
  return (
    core.action === record.action &&
    (core.direction ?? null) === record.direction &&
    (core.interface ?? null) === record.interface &&
    (core.protocol ?? null) === record.protocol &&
    (core.fromAddress ?? null) === record.fromAddress &&
    (core.fromPort ?? null) === record.fromPort &&
    (core.toAddress ?? null) === record.toAddress &&
    (core.toPort ?? null) === record.toPort &&
    (core.appName ?? null) === record.appName &&
    core.logMode === record.logMode &&
    (core.ruleComment ?? null) === record.ruleComment &&
    core.ipv6 === record.ipv6
  );
}

export function rowsDifferFromRuleRecords(
  desired: UnifiedRuleRow[],
  records: PersistedRuleRecord[],
): boolean {
  const activeDesired = getDesiredOrderedRules(desired);

  if (activeDesired.length !== records.length) {
    return true;
  }

  const recordByFingerprint = new Map(records.map((record) => [record.fingerprint, record]));

  for (let index = 0; index < activeDesired.length; index += 1) {
    const row = activeDesired[index];
    const fingerprint = resolveRuleFingerprint(row);
    const record = recordByFingerprint.get(fingerprint);

    if (!record) {
      return true;
    }

    if (record.sortOrder !== index) {
      return true;
    }

    if (normalizeUiValue(record.group) !== normalizeUiValue(row.ui.group)) {
      return true;
    }

    if (normalizeUiValue(record.name) !== normalizeUiValue(row.ui.name)) {
      return true;
    }

    if (normalizeUiValue(record.notes) !== normalizeUiValue(row.ui.notes)) {
      return true;
    }

    if (!coreMatchesRecord(row.core, record)) {
      return true;
    }
  }

  return false;
}
