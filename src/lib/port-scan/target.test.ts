import assert from "node:assert/strict";
import test from "node:test";

import { resolveScanTarget } from "@/lib/port-scan/target";

test("resolveScanTarget returns literal public IPv4", async () => {
  const resolved = await resolveScanTarget("8.8.8.8");
  assert.equal(resolved.host, "8.8.8.8");
  assert.equal(resolved.ip, "8.8.8.8");
});

test("resolveScanTarget rejects private literal IPv4", async () => {
  await assert.rejects(
    () => resolveScanTarget("10.0.0.5"),
    /not allowed/,
  );
});

test("resolveScanTarget rejects metadata literal IPv4", async () => {
  await assert.rejects(
    () => resolveScanTarget("169.254.169.254"),
    /not allowed/,
  );
});

test("resolveScanTarget rejects invalid hostnames", async () => {
  await assert.rejects(
    () => resolveScanTarget("localhost"),
    /not allowed/,
  );
});
