import assert from "node:assert/strict";
import test from "node:test";

import { serverNeedsInitialSync } from "@/lib/servers/needs-sync";

test("serverNeedsInitialSync is true without snapshot for signed-in user", () => {
  assert.equal(serverNeedsInitialSync(true, false), true);
});

test("serverNeedsInitialSync is false when snapshot exists", () => {
  assert.equal(serverNeedsInitialSync(true, true), false);
});

test("serverNeedsInitialSync is false without user", () => {
  assert.equal(serverNeedsInitialSync(false, false), false);
});
