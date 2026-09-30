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

test("resolveScanTarget rejects a literal docker gateway even when the alias is allowed", async () => {
  const previous = process.env.SSH_ALLOW_DOCKER_HOST;
  process.env.SSH_ALLOW_DOCKER_HOST = "true";

  try {
    await assert.rejects(() => resolveScanTarget("172.17.0.1"), /not allowed/);
    await assert.rejects(
      () => resolveScanTarget("host.docker.internal", async () => "172.17.0.1"),
      /outside the container network/,
    );
  } finally {
    if (previous === undefined) {
      delete process.env.SSH_ALLOW_DOCKER_HOST;
    } else {
      process.env.SSH_ALLOW_DOCKER_HOST = previous;
    }
  }
});
