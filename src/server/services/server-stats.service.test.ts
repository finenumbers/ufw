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
    ufwRuleCount: 0,
    portFindingCount: 0,
    containerCount: 0,
  });
});

test("mergeServerInventoryStats maps counts from lookup maps", () => {
  const stats = mergeServerInventoryStats(
    "server-a",
    new Map([["server-a", 12]]),
    new Map([["server-a", 7]]),
    new Map([["server-a", 3]]),
  );

  assert.deepEqual(stats, {
    ufwRuleCount: 12,
    portFindingCount: 7,
    containerCount: 3,
  });
});
