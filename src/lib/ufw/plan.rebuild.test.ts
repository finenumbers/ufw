import assert from "node:assert/strict";
import test from "node:test";

import { rebuildApplyPlanAtConfirm } from "@/lib/ufw/plan";
import type { UnifiedRuleRow } from "@/types/rule";
import type { ParsedRemoteRule } from "@/types/ufw";

function makeRow(fingerprint: string, port: string): UnifiedRuleRow {
  return {
    clientRowId: fingerprint,
    fingerprint,
    sortOrder: 0,
    core: {
      action: "ALLOW",
      direction: "IN",
      interface: null,
      protocol: "TCP",
      fromAddress: "any",
      fromPort: null,
      toAddress: "any",
      toPort: port,
      appName: null,
      logMode: "NONE",
      ruleComment: null,
      ipv6: false,
    },
    ui: { group: null, name: port, notes: null },
    originState: "MATCHED",
    sources: { remote: true, local: true, draft: false },
  };
}

function makeRemote(fingerprint: string, ruleNumber: number, port: string): ParsedRemoteRule {
  const row = makeRow(fingerprint, port);
  return { fingerprint, ruleNumber, rawLine: "", core: row.core };
}

test("rebuildApplyPlanAtConfirm rebuilds add commands from desired rows", () => {
  const desired = [makeRow("fp-new", "9090")];
  const remote: ParsedRemoteRule[] = [];

  const plan = rebuildApplyPlanAtConfirm(desired, remote);
  assert.equal(plan.items.length, 1);
  assert.match(plan.items[0]?.remoteCommand ?? "", /^ufw allow /);
  assert.doesNotMatch(plan.items[0]?.remoteCommand ?? "", /;|&&|\|/);
});

test("rebuildApplyPlanAtConfirm ignores tampered stored commands", () => {
  const desired = [makeRow("fp1", "443")];
  const remote = [makeRemote("fp1", 1, "443")];
  const plan = rebuildApplyPlanAtConfirm(desired, remote);

  assert.equal(plan.items.length, 0);
});
