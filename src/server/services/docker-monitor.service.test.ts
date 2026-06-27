import assert from "node:assert/strict";
import test from "node:test";

import { mergePsAndStats, summarizeInventory } from "@/lib/docker/normalize";
import { parseDockerPsOutput } from "@/lib/docker/ps-parser";

test("docker inventory summary supports session-only UI counts", () => {
  const ps = parseDockerPsOutput(
    [
      '{"ID":"abc123def456","Names":"/web","Image":"nginx","Status":"Up 2 hours","State":"running","Ports":""}',
      '{"ID":"def456abc789","Names":"/db","Image":"postgres","Status":"Exited (0) 1 day ago","State":"exited","Ports":""}',
    ].join("\n"),
  );

  const summary = summarizeInventory(mergePsAndStats(ps, []));
  assert.equal(summary.containerCount, 2);
  assert.equal(summary.runningCount, 1);
  assert.equal(summary.stoppedCount, 1);
});
