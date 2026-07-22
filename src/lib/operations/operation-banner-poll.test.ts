import assert from "node:assert/strict";
import test from "node:test";

import {
  shouldContinueBannerPoll,
  shouldNotifyOperationEnded,
} from "@/lib/operations/operation-banner-poll";
import type { ActiveOperation } from "@/types/operation";

const runningOperation: ActiveOperation = {
  id: "op-1",
  serverId: "server-1",
  type: "ufw.sync",
  status: "RUNNING",
  message: "Syncing",
  metadata: null,
  startedAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

test("shouldNotifyOperationEnded emits on RUNNING to null transition", () => {
  assert.equal(shouldNotifyOperationEnded("RUNNING", null), true);
  assert.equal(shouldNotifyOperationEnded("PENDING", null), true);
});

test("shouldNotifyOperationEnded emits on terminal status", () => {
  assert.equal(
    shouldNotifyOperationEnded(undefined, { ...runningOperation, status: "SUCCESS" }),
    true,
  );
});

test("shouldNotifyOperationEnded ignores idle null to null", () => {
  assert.equal(shouldNotifyOperationEnded(undefined, null), false);
});

test("shouldContinueBannerPoll only tracks active operations", () => {
  assert.equal(shouldContinueBannerPoll(runningOperation), true);
  assert.equal(shouldContinueBannerPoll({ ...runningOperation, status: "PENDING" }), true);
  assert.equal(shouldContinueBannerPoll(null), false);
  assert.equal(shouldContinueBannerPoll({ ...runningOperation, status: "SUCCESS" }), false);
});
