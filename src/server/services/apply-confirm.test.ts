import assert from "node:assert/strict";
import test from "node:test";

import { storedPlanItemsMatchPlan, storedSummaryMatchesPlan } from "@/server/services/apply-sync";
import type { ApplyPlan } from "@/types/apply";

function plan(summary: ApplyPlan["summary"], items: ApplyPlan["items"] = []): ApplyPlan {
  return { summary, items };
}

test("storedSummaryMatchesPlan accepts matching preview and confirm plans", () => {
  const summary = { addCount: 1, removeCount: 0, updateCount: 0, orderResync: false };
  const items = [
    {
      action: "ADD" as const,
      fingerprint: "fp1",
      remoteCommand: "ufw allow 22/tcp",
      sortOrder: 0,
    },
  ];
  assert.equal(storedSummaryMatchesPlan(summary, plan(summary, items)), true);
});

test("storedSummaryMatchesPlan rejects count drift", () => {
  const stored = { addCount: 1, removeCount: 0, updateCount: 0, orderResync: false };
  const rebuilt = { addCount: 2, removeCount: 0, updateCount: 0, orderResync: false };
  assert.equal(storedSummaryMatchesPlan(stored, plan(rebuilt)), false);
});

test("storedSummaryMatchesPlan rejects ufw/no-ufw branch drift", () => {
  const stored = { addCount: 0, removeCount: 0, updateCount: 0, orderResync: false };
  const rebuilt = { addCount: 1, removeCount: 0, updateCount: 0, orderResync: false };
  assert.equal(storedSummaryMatchesPlan(stored, plan(rebuilt)), false);
});

test("storedSummaryMatchesPlan rejects orderResync drift", () => {
  const stored = { addCount: 0, removeCount: 0, updateCount: 0, orderResync: true };
  const rebuilt = { addCount: 0, removeCount: 0, updateCount: 0, orderResync: false };
  assert.equal(storedSummaryMatchesPlan(stored, plan(rebuilt)), false);
});

test("storedPlanItemsMatchPlan accepts matching preview items", () => {
  const items = [
    {
      action: "ADD" as const,
      fingerprint: "fp1",
      remoteCommand: "ufw allow 22/tcp",
      sortOrder: 0,
    },
  ];
  const summary = { addCount: 1, removeCount: 0, updateCount: 0, orderResync: false };
  assert.equal(
    storedPlanItemsMatchPlan(items, plan(summary, items)),
    true,
  );
});

test("storedPlanItemsMatchPlan rejects fingerprint swap with same counts", () => {
  const storedItems = [
    {
      action: "ADD" as const,
      fingerprint: "fp-a",
      remoteCommand: "ufw allow 22/tcp",
      sortOrder: 0,
    },
  ];
  const rebuiltItems = [
    {
      action: "ADD" as const,
      fingerprint: "fp-b",
      remoteCommand: "ufw allow 443/tcp",
      sortOrder: 0,
    },
  ];
  const summary = { addCount: 1, removeCount: 0, updateCount: 0, orderResync: false };
  assert.equal(storedSummaryMatchesPlan(summary, plan(summary, rebuiltItems)), true);
  assert.equal(storedPlanItemsMatchPlan(storedItems, plan(summary, rebuiltItems)), false);
});
