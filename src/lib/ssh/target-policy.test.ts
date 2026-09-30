import assert from "node:assert/strict";
import test from "node:test";

import { readSshTargetPolicy } from "@/lib/ssh/target-policy";
import { createServerSchema } from "@/lib/validations/server";

test("readSshTargetPolicy enables the docker host only for the exact value true", () => {
  assert.equal(readSshTargetPolicy({}).allowDockerHost, false);
  assert.equal(readSshTargetPolicy({ SSH_ALLOW_DOCKER_HOST: "false" }).allowDockerHost, false);
  assert.equal(readSshTargetPolicy({ SSH_ALLOW_DOCKER_HOST: " true " }).allowDockerHost, true);
  assert.deepEqual(readSshTargetPolicy({ SSH_ALLOWED_CIDRS: " 10.0.0.0/8, 192.168.1.0/24 " }).allowedCidrs, [
    "10.0.0.0/8",
    "192.168.1.0/24",
  ]);
});

test("createServerSchema uses the passed policy and ignores process env", () => {
  const previous = process.env.SSH_ALLOW_DOCKER_HOST;
  process.env.SSH_ALLOW_DOCKER_HOST = "true";

  try {
    const closed = createServerSchema({ allowDockerHost: false, allowedCidrs: [] });
    const parsed = closed.safeParse({
      name: "This host",
      host: "host.docker.internal",
      port: 22,
      identityId: "identity",
    });
    assert.equal(parsed.success, false);

    const open = createServerSchema({ allowDockerHost: true, allowedCidrs: [] });
    const allowed = open.safeParse({
      name: "This host",
      host: "host.docker.internal",
      port: 22,
      identityId: "identity",
    });
    assert.equal(allowed.success, true);

    const literalGateway = open.safeParse({
      name: "Gateway",
      host: "172.17.0.1",
      port: 22,
      identityId: "identity",
    });
    assert.equal(literalGateway.success, false);
  } finally {
    if (previous === undefined) {
      delete process.env.SSH_ALLOW_DOCKER_HOST;
    } else {
      process.env.SSH_ALLOW_DOCKER_HOST = previous;
    }
  }
});