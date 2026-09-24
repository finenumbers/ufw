import assert from "node:assert/strict";
import test from "node:test";

import { resolveProbeTarget } from "@/lib/reachability/target";

test("resolveProbeTarget skips loopback, metadata, and garbage", async () => {
  const lookup = async () => {
    throw new Error("lookup should not run");
  };
  assert.deepEqual(await resolveProbeTarget("127.0.0.1", lookup), { kind: "skip" });
  assert.deepEqual(await resolveProbeTarget("169.254.169.254", lookup), { kind: "skip" });
  assert.deepEqual(await resolveProbeTarget("localhost", lookup), { kind: "skip" });
  assert.deepEqual(await resolveProbeTarget("bad host", lookup), { kind: "skip" });
});

test("resolveProbeTarget pins private, CGNAT, and public literals", async () => {
  assert.deepEqual(await resolveProbeTarget("10.0.0.1", async () => "203.0.113.5"), {
    kind: "ip",
    ip: "10.0.0.1",
  });
  assert.deepEqual(await resolveProbeTarget("100.64.1.1", async () => "203.0.113.5"), {
    kind: "ip",
    ip: "100.64.1.1",
  });
  assert.deepEqual(await resolveProbeTarget("8.8.8.8", async () => "203.0.113.5"), {
    kind: "ip",
    ip: "8.8.8.8",
  });
});

test("resolveProbeTarget keeps private DNS answers and skips metadata answers", async () => {
  assert.deepEqual(await resolveProbeTarget("example.com", async () => "8.8.8.8"), {
    kind: "ip",
    ip: "8.8.8.8",
  });
  assert.deepEqual(await resolveProbeTarget("vpn.example.com", async () => "10.1.1.1"), {
    kind: "ip",
    ip: "10.1.1.1",
  });
  assert.deepEqual(await resolveProbeTarget("example.com", async () => "169.254.169.254"), {
    kind: "skip",
  });
  assert.deepEqual(
    await resolveProbeTarget("example.com", async () => {
      throw new Error("ENOTFOUND");
    }),
    { kind: "unresolved" },
  );
});
