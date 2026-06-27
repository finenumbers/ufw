import assert from "node:assert/strict";
import test from "node:test";

import { storedSummaryMatchesPlan } from "@/server/services/apply-sync";
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
