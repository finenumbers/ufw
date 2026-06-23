import assert from "node:assert/strict";
import test from "node:test";

import {
  buildPostApplyRuleRecords,
  resolveApplyClaimError,
} from "@/server/services/apply-sync";
import type { UnifiedRuleRow } from "@/types/rule";

const snapshotRule = {
  fingerprint: "fp-ssh",
  action: "ALLOW" as const,
  direction: "IN" as const,
  interface: "eth0",
  protocol: "TCP" as const,
  fromAddress: "any",
  fromPort: null,
  toAddress: "any",
  toPort: "22",
  appName: null,
  logMode: "NONE" as const,
  ruleComment: "remote comment",
  ipv6: false,
};

const desiredRow: UnifiedRuleRow = {
  clientRowId: "row-1",
  fingerprint: "fp-ssh",
  sortOrder: 0,
  core: {
    action: "ALLOW",
    direction: "IN",
    interface: "wan0",
    protocol: "TCP",
    fromAddress: "203.0.113.0/24",
    fromPort: null,
    toAddress: "any",
    toPort: "22",
    appName: "OpenSSH",
    logMode: "LOG",
    ruleComment: "stale draft comment",
    ipv6: false,
  },
  ui: {
    group: "SSH",
    name: "Allow SSH",
    notes: "saved ui note",
  },
  originState: "MATCHED",
  sources: { remote: true, local: true, draft: true },
};

test("buildPostApplyRuleRecords uses snapshot core and desired ui metadata", () => {
  const records = buildPostApplyRuleRecords([snapshotRule], [desiredRow]);

  assert.equal(records.length, 1);
  assert.equal(records[0]?.core.interface, "eth0");
  assert.equal(records[0]?.core.ruleComment, "remote comment");
  assert.equal(records[0]?.ui.group, "SSH");
  assert.equal(records[0]?.ui.name, "Allow SSH");
  assert.equal(records[0]?.ui.notes, "saved ui note");
  assert.notEqual(records[0]?.core.interface, desiredRow.core.interface);
});

test("resolveApplyClaimError accepts exactly one claimed session", () => {
  assert.equal(resolveApplyClaimError(1), null);
  assert.match(resolveApplyClaimError(0) ?? "", /not pending/i);
  assert.match(resolveApplyClaimError(2) ?? "", /not pending/i);
});
