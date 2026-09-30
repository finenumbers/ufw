import assert from "node:assert/strict";
import test from "node:test";

import { EMPTY_CONTAINER_ROUTES, type ContainerRoutes } from "@/lib/ssh/docker-host-gateway";
import { resolveManagedHost } from "@/lib/ssh/resolve-host";
import type { SshTargetPolicy } from "@/lib/validations/ssh-host";

const denied: SshTargetPolicy = { allowDockerHost: false, allowedCidrs: [] };
const allowed: SshTargetPolicy = { allowDockerHost: true, allowedCidrs: [] };

const ownNetwork: ContainerRoutes = {
  gateway: "172.21.0.1",
  subnet: "172.21.0.0/16",
  connectedSubnets: ["172.21.0.0/16", "172.20.0.0/16"],
};

test("resolveManagedHost rejects the docker host alias when the policy is off", async () => {
  await assert.rejects(
    () =>
      resolveManagedHost(
        "host.docker.internal",
        denied,
        async () => "172.17.0.1",
        async () => ownNetwork,
      ),
    /Host is not allowed/,
  );
});

test("resolveManagedHost uses the container gateway and ignores docker0 DNS", async () => {
  const ip = await resolveManagedHost(
    "HOST.DOCKER.INTERNAL",
    allowed,
    async () => "172.17.0.1",
    async () => ownNetwork,
  );
  assert.equal(ip, "172.21.0.1");
});

test("resolveManagedHost accepts DNS only inside a connected container subnet", async () => {
  const routes: ContainerRoutes = {
    gateway: null,
    subnet: null,
    connectedSubnets: ["172.21.0.0/16"],
  };
  const ip = await resolveManagedHost(
    "host.docker.internal",
    allowed,
    async () => "172.21.0.1",
    async () => routes,
  );
  assert.equal(ip, "172.21.0.1");
});

test("resolveManagedHost rejects docker0 when the container is on another bridge", async () => {
  await assert.rejects(
    () =>
      resolveManagedHost(
        "host.docker.internal",
        allowed,
        async () => "172.17.0.1",
        async () => EMPTY_CONTAINER_ROUTES,
      ),
    /outside the container network/,
  );
  await assert.rejects(
    () =>
      resolveManagedHost(
        "host.docker.internal",
        allowed,
        async () => "172.17.0.1",
        async () => ({ ...ownNetwork, gateway: null, subnet: null }),
      ),
    /outside 172\.21\.0\.0\/16, 172\.20\.0\.0\/16/,
  );
});

test("resolveManagedHost rejects a loopback or public address for the docker host alias", async () => {
  await assert.rejects(
    () =>
      resolveManagedHost(
        "host.docker.internal",
        allowed,
        async () => "127.0.0.1",
        async () => EMPTY_CONTAINER_ROUTES,
      ),
    /did not resolve to a private address/,
  );
  await assert.rejects(
    () =>
      resolveManagedHost(
        "host.docker.internal",
        allowed,
        async () => "8.8.8.8",
        async () => EMPTY_CONTAINER_ROUTES,
      ),
    /did not resolve to a private address/,
  );
});

test("resolveManagedHost reports a missing docker host alias", async () => {
  await assert.rejects(
    () =>
      resolveManagedHost(
        "host.docker.internal",
        allowed,
        async () => {
          throw new Error("ENOTFOUND");
        },
        async () => EMPTY_CONTAINER_ROUTES,
      ),
    /Docker host alias did not resolve$/,
  );
});

test("resolveManagedHost keeps literal gateway addresses blocked", async () => {
  await assert.rejects(
    () => resolveManagedHost("172.17.0.1", allowed, async () => "172.17.0.1"),
    /not allowed/,
  );
});
