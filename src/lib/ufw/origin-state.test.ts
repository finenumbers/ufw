import assert from "node:assert/strict";
import test from "node:test";

import { originStateToSources, resolveRuleOriginState } from "@/lib/ufw/origin-state";

test("resolveRuleOriginState returns MATCHED when present on server and in local DB", () => {
  const remote = new Set(["a", "b"]);
  const local = new Set(["a", "b"]);

  assert.equal(resolveRuleOriginState("a", remote, local), "MATCHED");
});

test("resolveRuleOriginState returns REMOTE_ONLY when only on server", () => {
  const remote = new Set(["a"]);
  const local = new Set<string>();

  assert.equal(resolveRuleOriginState("a", remote, local), "REMOTE_ONLY");
});

test("resolveRuleOriginState returns LOCAL_ONLY when only in local DB", () => {
  const remote = new Set<string>();
  const local = new Set(["a"]);

  assert.equal(resolveRuleOriginState("a", remote, local), "LOCAL_ONLY");
});

test("originStateToSources maps MATCHED to remote and local", () => {
  assert.deepEqual(originStateToSources("MATCHED"), {
    remote: true,
    local: true,
    draft: false,
  });
});
