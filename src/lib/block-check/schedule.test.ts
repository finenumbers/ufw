import assert from "node:assert/strict";
import test from "node:test";

import {
  BLOCK_CHECK_BACKOFF_MS,
  BLOCK_CHECK_INTERVAL_MS,
  BLOCK_CHECK_PROBE_GAP_MS,
  applyObservation,
  isHostDue,
  probeDelayMs,
  shouldStartBlockCheckRefresh,
} from "@/lib/block-check/schedule";

const now = 1_000_000;

test("isHostDue waits ten minutes after a successful check", () => {
  const fresh = applyObservation(undefined, { kind: "status", status: "blocked" }, now);
  assert.equal(isHostDue(fresh, now + BLOCK_CHECK_INTERVAL_MS - 1), false);
  assert.equal(isHostDue(fresh, now + BLOCK_CHECK_INTERVAL_MS), true);
});

test("applyObservation keeps the previous verdict and backs off", () => {
  const previous = applyObservation(
    undefined,
    { kind: "status", status: "unrestricted" },
    now - BLOCK_CHECK_INTERVAL_MS,
  );
  const kept = applyObservation(previous, { kind: "keep" }, now);
  assert.equal(kept.status, "unrestricted");
  assert.equal(kept.checkedAt, previous.checkedAt);
  assert.equal(kept.backoffUntil, now + BLOCK_CHECK_BACKOFF_MS);
  assert.equal(isHostDue(kept, now), false);
  assert.equal(isHostDue(kept, now + BLOCK_CHECK_BACKOFF_MS), true);
});

test("probeDelayMs is measured from the previous probe start", () => {
  assert.equal(probeDelayMs(0, now), 0);
  assert.equal(probeDelayMs(now - 8_000, now), BLOCK_CHECK_PROBE_GAP_MS - 8_000);
  assert.equal(probeDelayMs(now - BLOCK_CHECK_PROBE_GAP_MS, now), 0);
  assert.equal(probeDelayMs(now - BLOCK_CHECK_PROBE_GAP_MS - 5_000, now), 0);
});

test("shouldStartBlockCheckRefresh skips an in-flight cycle and global backoff", () => {
  assert.equal(shouldStartBlockCheckRefresh({ now, inflight: true, backoffUntil: 0 }), false);
  assert.equal(shouldStartBlockCheckRefresh({ now, inflight: false, backoffUntil: now + 1 }), false);
  assert.equal(shouldStartBlockCheckRefresh({ now, inflight: false, backoffUntil: now }), true);
});
