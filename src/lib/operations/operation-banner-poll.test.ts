import assert from "node:assert/strict";
import test from "node:test";

import {
  isWithinOperationStartGracePeriod,
  OPERATION_START_GRACE_PERIOD_MS,
  shouldContinueBannerPoll,
  shouldContinueGracePoll,
  shouldNotifyGracePeriodExpired,
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

test("isWithinOperationStartGracePeriod respects the grace window", () => {
  const startedAt = 1_000_000;
  assert.equal(isWithinOperationStartGracePeriod(startedAt, startedAt), true);
  assert.equal(
    isWithinOperationStartGracePeriod(startedAt, startedAt + OPERATION_START_GRACE_PERIOD_MS - 1),
    true,
  );
  assert.equal(
    isWithinOperationStartGracePeriod(startedAt, startedAt + OPERATION_START_GRACE_PERIOD_MS),
    false,
  );
});

test("shouldContinueGracePoll retries null until active or grace expires", () => {
  const startedAt = 5_000;
  assert.equal(shouldContinueGracePoll(startedAt, null, startedAt + 100), true);
  assert.equal(
    shouldContinueGracePoll(startedAt, null, startedAt + OPERATION_START_GRACE_PERIOD_MS),
    false,
  );
  assert.equal(shouldContinueGracePoll(startedAt, runningOperation, startedAt + 100), false);
  assert.equal(
    shouldContinueGracePoll(startedAt, { ...runningOperation, status: "SUCCESS" }, startedAt + 100),
    false,
  );
});

test("shouldNotifyGracePeriodExpired fires only after grace without active op", () => {
  const startedAt = 10_000;
  const beforeExpiry = startedAt + OPERATION_START_GRACE_PERIOD_MS - 1;
  const afterExpiry = startedAt + OPERATION_START_GRACE_PERIOD_MS;

  assert.equal(shouldNotifyGracePeriodExpired(startedAt, null, false, beforeExpiry), false);
  assert.equal(shouldNotifyGracePeriodExpired(startedAt, null, false, afterExpiry), true);
  assert.equal(shouldNotifyGracePeriodExpired(startedAt, null, true, afterExpiry), false);
  assert.equal(shouldNotifyGracePeriodExpired(startedAt, runningOperation, false, afterExpiry), false);
});
