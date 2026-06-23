import assert from "node:assert/strict";
import test from "node:test";

import { diffDesiredVsRemote, needsOrderResync } from "@/lib/ufw/diff";
import { buildApplyPlan, hasApplyChanges } from "@/lib/ufw/plan";
import type { UnifiedRuleRow } from "@/types/rule";
import type { ParsedRemoteRule } from "@/types/ufw";

function makeRow(
  fingerprint: string,
  sortOrder: number,
  port: string,
): UnifiedRuleRow {
  return {
    clientRowId: fingerprint,
    fingerprint,
    sortOrder,
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

function makeRemote(
  fingerprint: string,
  ruleNumber: number,
  port: string,
): ParsedRemoteRule {
  const row = makeRow(fingerprint, ruleNumber - 1, port);
  return {
    fingerprint,
    ruleNumber,
    rawLine: "",
    core: row.core,
  };
}

test("needsOrderResync detects pure reorder", () => {
  const desired = [makeRow("a", 0, "22"), makeRow("b", 1, "80"), makeRow("c", 2, "443")];
  const remote = [makeRemote("a", 1, "22"), makeRemote("c", 2, "443"), makeRemote("b", 3, "80")];

  assert.equal(needsOrderResync(desired, remote), true);
});

test("needsOrderResync ignores matching order", () => {
  const desired = [makeRow("a", 0, "22"), makeRow("b", 1, "80")];
  const remote = [makeRemote("a", 1, "22"), makeRemote("b", 2, "80")];

  assert.equal(needsOrderResync(desired, remote), false);
});

test("buildApplyPlan rewrites remote order without content changes", () => {
  const desired = [makeRow("a", 0, "22"), makeRow("b", 1, "80"), makeRow("c", 2, "443")];
  const remote = [makeRemote("a", 1, "22"), makeRemote("c", 2, "443"), makeRemote("b", 3, "80")];
  const diff = diffDesiredVsRemote(desired, remote);
  const plan = buildApplyPlan(diff, desired, remote);

  assert.equal(diff.items.length, 0);
  assert.equal(hasApplyChanges(plan), true);
  assert.equal(plan.summary.removeCount, 0);
  assert.equal(plan.summary.addCount, 0);
  assert.equal(plan.summary.updateCount, 3);
  assert.equal(plan.items.filter((item) => item.action === "REMOVE").length, 3);
  assert.equal(plan.items.filter((item) => item.action === "UPDATE").length, 3);
  assert.deepEqual(
    plan.items.slice(3).map((item) => item.fingerprint),
    ["a", "b", "c"],
  );
});

test("buildApplyPlan inserts new rule in the middle during order resync", () => {
  const desired = [
    makeRow("a", 0, "22"),
    makeRow("new", 1, "8080"),
    makeRow("b", 2, "80"),
  ];
  const remote = [makeRemote("a", 1, "22"), makeRemote("b", 2, "80")];
  const diff = diffDesiredVsRemote(desired, remote);
  const plan = buildApplyPlan(diff, desired, remote);

  assert.equal(plan.summary.removeCount, 0);
  assert.equal(plan.summary.addCount, 1);
  assert.equal(plan.summary.updateCount, 2);
  assert.equal(plan.items.at(-1)?.fingerprint, "b");
  assert.equal(plan.items.at(-2)?.fingerprint, "new");
});

test("buildApplyPlan requires delete commands for reorder", () => {
  const desired = [makeRow("a", 0, "22"), makeRow("b", 1, "80")];
  const remoteWithoutNumbers = [
    { ...makeRemote("a", 1, "22"), ruleNumber: undefined },
    { ...makeRemote("b", 2, "80"), ruleNumber: undefined },
  ];
  const diff = diffDesiredVsRemote(desired, remoteWithoutNumbers);
  const plan = buildApplyPlan(diff, [makeRow("b", 0, "80"), makeRow("a", 1, "22")], remoteWithoutNumbers);

  assert.equal(plan.summary.updateCount, 2);
  assert.equal(
    plan.items.filter((item) => item.action === "REMOVE" && item.remoteCommand).length,
    0,
  );
});

test("buildApplyPlan keeps simple append add without order resync", () => {
  const desired = [makeRow("a", 0, "22"), makeRow("b", 1, "80"), makeRow("new", 2, "8080")];
  const remote = [makeRemote("a", 1, "22"), makeRemote("b", 2, "80")];
  const diff = diffDesiredVsRemote(desired, remote);
  const plan = buildApplyPlan(diff, desired, remote);

  assert.equal(needsOrderResync(desired, remote), false);
  assert.equal(plan.summary.addCount, 1);
  assert.equal(plan.summary.updateCount, 0);
  assert.equal(plan.items.length, 1);
  assert.equal(plan.items[0]?.action, "ADD");
  assert.ok(plan.items.every((item) => item.remoteCommand));
});

test("buildApplyPlan emits delete commands when rule numbers are present", () => {
  const desired = [makeRow("b", 0, "80"), makeRow("a", 1, "22")];
  const remote = [makeRemote("a", 1, "22"), makeRemote("b", 2, "80")];
  const diff = diffDesiredVsRemote(desired, remote);
  const plan = buildApplyPlan(diff, desired, remote);

  assert.ok(plan.items.every((item) => item.remoteCommand));
  assert.match(plan.items[0]?.remoteCommand ?? "", /^ufw --force delete /);
});
