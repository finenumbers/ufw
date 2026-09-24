import assert from "node:assert/strict";
import test from "node:test";

import { shouldSkipPingHost } from "@/lib/reachability/target";

test("shouldSkipPingHost skips loopback, metadata, flags, and garbage", () => {
  assert.equal(shouldSkipPingHost("127.0.0.1"), true);
  assert.equal(shouldSkipPingHost("169.254.169.254"), true);
  assert.equal(shouldSkipPingHost("localhost"), true);
  assert.equal(shouldSkipPingHost("bad host"), true);
  assert.equal(shouldSkipPingHost("-c"), true);
  assert.equal(shouldSkipPingHost("fe80::1"), true);
});

test("shouldSkipPingHost pings ordinary names and private addresses", () => {
  assert.equal(shouldSkipPingHost("poland.gate.finenumbers.com"), false);
  assert.equal(shouldSkipPingHost("10.0.0.1"), false);
  assert.equal(shouldSkipPingHost("100.64.1.1"), false);
  assert.equal(shouldSkipPingHost("8.8.8.8"), false);
});
