import assert from "node:assert/strict";
import test from "node:test";

import { resolveManagedHost } from "@/lib/ssh/resolve-host";
import type { SshTargetPolicy } from "@/lib/validations/ssh-host";

const denied: SshTargetPolicy = { allowDockerHost: false, allowedCidrs: [] };
const allowed: SshTargetPolicy = { allowDockerHost: true, allowedCidrs: [] };

test("resolveManagedHost rejects the docker host alias when the policy is off", async () => {
  await assert.rejects(
    () => resolveManagedHost("host.docker.internal", denied, async () => "172.17.0.1"),
    /Host is not allowed/,
  );
});

test("resolveManagedHost pins a private gateway for the docker host alias", async () => {
  const ip = await resolveManagedHost(
    "HOST.DOCKER.INTERNAL",
    allowed,
    async () => "172.17.0.1",
  );
  assert.equal(ip, "172.17.0.1");
});

test("resolveManagedHost rejects a loopback or public address for the docker host alias", async () => {
  await assert.rejects(
    () => resolveManagedHost("host.docker.internal", allowed, async () => "127.0.0.1"),
    /did not resolve to a private address/,
  );
  await assert.rejects(
    () => resolveManagedHost("host.docker.internal", allowed, async () => "8.8.8.8"),
    /did not resolve to a private address/,
  );
});

test("resolveManagedHost reports a missing docker host alias", async () => {
  await assert.rejects(
    () =>
      resolveManagedHost("host.docker.internal", allowed, async () => {
        throw new Error("ENOTFOUND");
      }),
    /Docker host alias did not resolve$/,
  );
});

test("resolveManagedHost keeps literal gateway addresses blocked", async () => {
  await assert.rejects(
    () => resolveManagedHost("172.17.0.1", allowed, async () => "172.17.0.1"),
    /not allowed/,
  );
});