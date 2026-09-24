import assert from "node:assert/strict";
import test from "node:test";

import {
  REACHABILITY_BACKOFF_MS,
  REACHABILITY_INTERVAL_MS,
  shouldStartReachabilityProbe,
} from "@/lib/reachability/schedule";

const base = {
  now: 100_000,
  checkedAt: 100_000,
  inflight: false,
  backoffUntil: 0,
};

test("shouldStartReachabilityProbe starts when no snapshot exists", () => {
  assert.equal(shouldStartReachabilityProbe({ ...base, checkedAt: null }), true);
});

test("shouldStartReachabilityProbe waits for the interval", () => {
  assert.equal(
    shouldStartReachabilityProbe({
      ...base,
      checkedAt: base.now - REACHABILITY_INTERVAL_MS + 1,
    }),
    false,
  );
  assert.equal(
    shouldStartReachabilityProbe({
      ...base,
      checkedAt: base.now - REACHABILITY_INTERVAL_MS,
    }),
    true,
  );
});

test("shouldStartReachabilityProbe skips inflight and backoff", () => {
  assert.equal(shouldStartReachabilityProbe({ ...base, checkedAt: null, inflight: true }), false);
  assert.equal(
    shouldStartReachabilityProbe({
      ...base,
      checkedAt: null,
      backoffUntil: base.now + REACHABILITY_BACKOFF_MS,
    }),
    false,
  );
});
