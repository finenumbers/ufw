import assert from "node:assert/strict";
import test from "node:test";

import { applyProbeSample, type HostObservation } from "@/lib/reachability/sample";

const reachable: HostObservation = {
  status: "reachable",
  rttMs: 83,
  consecutiveFailures: 0,
};

test("applyProbeSample marks the first failure unreachable", () => {
  const next = applyProbeSample(undefined, { reachable: false, rttMs: null });
  assert.equal(next.status, "unreachable");
  assert.equal(next.rttMs, null);
  assert.equal(next.consecutiveFailures, 1);
});

test("applyProbeSample keeps the last RTT after one miss", () => {
  const next = applyProbeSample(reachable, { reachable: false, rttMs: null });
  assert.equal(next.status, "reachable");
  assert.equal(next.rttMs, 83);
  assert.equal(next.consecutiveFailures, 1);
});

test("applyProbeSample turns red on the second consecutive miss", () => {
  const once = applyProbeSample(reachable, { reachable: false, rttMs: null });
  const twice = applyProbeSample(once, { reachable: false, rttMs: null });
  assert.equal(twice.status, "unreachable");
  assert.equal(twice.rttMs, null);
  assert.equal(twice.consecutiveFailures, 2);
});

test("applyProbeSample recovers on the next reply", () => {
  const down = applyProbeSample(undefined, { reachable: false, rttMs: null });
  const up = applyProbeSample(down, { reachable: true, rttMs: 12 });
  assert.deepEqual(up, { status: "reachable", rttMs: 12, consecutiveFailures: 0 });
});
