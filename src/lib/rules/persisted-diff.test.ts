import assert from "node:assert/strict";
import test from "node:test";

import { rowsDifferFromRuleRecords } from "@/lib/rules/persisted-diff";
import { computeFingerprint } from "@/lib/ufw/fingerprint";
import type { UnifiedRuleRow } from "@/types/rule";
import { buildTableRowsFromSources } from "@/server/services/rules-view.service";

function makeRow(
  overrides: Partial<UnifiedRuleRow> & { core?: Partial<UnifiedRuleRow["core"]> } = {},
): UnifiedRuleRow {
  const core = {
    action: "ALLOW" as const,
    direction: "IN" as const,
    interface: null,
    protocol: "TCP" as const,
    fromAddress: "any",
    fromPort: null,
    toAddress: "any",
    toPort: "22",
    appName: null,
    logMode: "NONE" as const,
    ruleComment: null,
    ipv6: false,
    ...overrides.core,
  };

  const fingerprint = overrides.fingerprint ?? computeFingerprint(core);

  return {
    clientRowId: overrides.clientRowId ?? "row-1",
    fingerprint,
    sortOrder: overrides.sortOrder ?? 0,
    core,
    ui: overrides.ui ?? { group: null, name: null, notes: null },
    originState: overrides.originState ?? "REMOTE_ONLY",
    sources: overrides.sources ?? { remote: true, local: false, draft: false },
  };
}

test("buildTableRowsFromSources merges remote and local without duplicates", () => {
  const remoteCore = {
    action: "ALLOW" as const,
    direction: "IN" as const,
    interface: null,
    protocol: "TCP" as const,
    fromAddress: "any",
    fromPort: null,
    toAddress: "any",
    toPort: "443",
    appName: null,
    logMode: "NONE" as const,
    ruleComment: null,
    ipv6: false,
  };
  const remoteFingerprint = computeFingerprint(remoteCore);
  const localCore = {
    action: "ALLOW" as const,
    direction: "IN" as const,
    interface: null,
    protocol: "TCP" as const,
    fromAddress: "10.0.0.1",
    fromPort: null,
    toAddress: "any",
    toPort: "22",
    appName: null,
    logMode: "NONE" as const,
    ruleComment: null,
    ipv6: false,
  };
  const localFingerprint = computeFingerprint(localCore);

  const rows = buildTableRowsFromSources(
    [
      {
        fingerprint: remoteFingerprint,
        sortOrder: 0,
        ...remoteCore,
      },
    ],
    [
      {
        fingerprint: remoteFingerprint,
        sortOrder: 0,
        ...remoteCore,
        group: "web",
        name: "https",
        notes: null,
      },
      {
        fingerprint: localFingerprint,
        sortOrder: 1,
        ...localCore,
        group: "ssh",
        name: "admin",
        notes: null,
      },
    ],
  );

  assert.equal(rows.length, 2);
  assert.equal(rows[0]?.originState, "MATCHED");
  assert.equal(rows[0]?.ui.group, "web");
  assert.equal(rows[1]?.originState, "LOCAL_ONLY");
  assert.equal(rows[1]?.ui.group, "ssh");
});

test("rowsDifferFromRuleRecords detects metadata changes", () => {
  const row = makeRow({ ui: { group: "new-group", name: null, notes: null } });
  const records = [
    {
      fingerprint: row.fingerprint,
      sortOrder: 0,
      action: row.core.action,
      direction: row.core.direction,
      interface: row.core.interface,
      protocol: row.core.protocol,
      fromAddress: row.core.fromAddress,
      fromPort: row.core.fromPort,
      toAddress: row.core.toAddress,
      toPort: row.core.toPort,
      appName: row.core.appName,
      logMode: row.core.logMode,
      ruleComment: row.core.ruleComment,
      ipv6: row.core.ipv6,
      group: "old-group",
      name: null,
      notes: null,
    },
  ];

  assert.equal(rowsDifferFromRuleRecords([row], records), true);
});
