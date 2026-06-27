import assert from "node:assert/strict";
import test from "node:test";

import {
  activeOperationPollDelayMs,
  isTerminalOperationStatus,
} from "@/lib/operations/poll-interval";

test("activeOperationPollDelayMs uses 1s polling during active operations", () => {
  assert.equal(activeOperationPollDelayMs(0), 1000);
  assert.equal(activeOperationPollDelayMs(29), 1000);
  assert.equal(activeOperationPollDelayMs(30), 3000);
});

test("isTerminalOperationStatus detects finished states", () => {
  assert.equal(isTerminalOperationStatus("SUCCESS"), true);
  assert.equal(isTerminalOperationStatus("RUNNING"), false);
});
