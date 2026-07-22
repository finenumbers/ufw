import assert from "node:assert/strict";
import test from "node:test";

import { mergeServerInventoryStats } from "@/server/services/server-stats.service";

test("mergeServerInventoryStats defaults missing server counts to zero", () => {
  const stats = mergeServerInventoryStats(
    "server-a",
    new Map([["server-b", 5]]),
    new Map(),
    new Map(),
  );

  assert.deepEqual(stats, {
    savedRuleCount: 0,
    remoteRuleCount: 0,
    portFindingCount: 0,
  });
});

test("mergeServerInventoryStats maps counts from lookup maps", () => {
  const stats = mergeServerInventoryStats(
    "server-a",
    new Map([["server-a", 12]]),
    new Map([["server-a", 9]]),
    new Map([["server-a", 7]]),
  );

  assert.deepEqual(stats, {
    savedRuleCount: 12,
    remoteRuleCount: 9,
    portFindingCount: 7,
  });
});
