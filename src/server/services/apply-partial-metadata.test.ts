import assert from "node:assert/strict";
import test from "node:test";

import { buildTableRowsFromSources } from "@/server/services/rules-view.service";
import type { UnifiedRuleRow } from "@/types/rule";

test("buildTableRowsFromSources preserves group/name from rule_record after partial apply metadata save", () => {
  const snapshotRules = [
    {
      fingerprint: "fp-mts",
      sortOrder: 0,
      rawLine: "[1] Anywhere ALLOW 5.227.161.160/27",
      action: "ALLOW" as const,
      direction: "IN" as const,
      interface: null,
      protocol: null,
      fromAddress: "5.227.161.160/27",
      fromPort: null,
      toAddress: "any",
      toPort: null,
      appName: null,
      logMode: "NONE" as const,
      ruleComment: null,
      ipv6: false,
    },
  ];

  const localRecords = [
    {
      fingerprint: "fp-mts",
      sortOrder: 0,
      action: "ALLOW" as const,
      direction: "IN" as const,
      interface: null,
      protocol: null,
      fromAddress: "5.227.161.160/27",
      fromPort: null,
      toAddress: "any",
      toPort: null,
      appName: null,
      logMode: "NONE" as const,
      ruleComment: null,
      ipv6: false,
      group: "Core",
      name: "MTS Network",
      notes: null,
    },
  ];

  const rows = buildTableRowsFromSources(snapshotRules, localRecords);

  assert.equal(rows.length, 1);
  assert.equal(rows[0]?.ui.group, "Core");
  assert.equal(rows[0]?.ui.name, "MTS Network");
});

test("buildTableRowsFromSources loses metadata when rule_record has no group/name", () => {
  const snapshotRules = [
    {
      fingerprint: "fp-mts",
      sortOrder: 0,
      rawLine: "[1] Anywhere ALLOW 5.227.161.160/27",
      action: "ALLOW" as const,
      direction: "IN" as const,
      interface: null,
      protocol: null,
      fromAddress: "5.227.161.160/27",
      fromPort: null,
      toAddress: "any",
      toPort: null,
      appName: null,
      logMode: "NONE" as const,
      ruleComment: null,
      ipv6: false,
    },
  ];

  const localRecords = [
    {
      fingerprint: "fp-mts",
      sortOrder: 0,
      action: "ALLOW" as const,
      direction: "IN" as const,
      interface: null,
      protocol: null,
      fromAddress: "5.227.161.160/27",
      fromPort: null,
      toAddress: "any",
      toPort: null,
      appName: null,
      logMode: "NONE" as const,
      ruleComment: null,
      ipv6: false,
      group: null,
      name: null,
      notes: null,
    },
  ];

  const rows = buildTableRowsFromSources(snapshotRules, localRecords) as UnifiedRuleRow[];

  assert.equal(rows[0]?.ui.group, null);
  assert.equal(rows[0]?.ui.name, null);
});
