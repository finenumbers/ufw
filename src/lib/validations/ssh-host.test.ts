import assert from "node:assert/strict";
import test from "node:test";

import {
  isAcceptableDockerHostGateway,
  validateResolvedIp,
  validateSshHost,
  type SshTargetPolicy,
} from "@/lib/validations/ssh-host";

test("validateSshHost blocks private and metadata addresses", () => {
  assert.equal(validateSshHost("127.0.0.1"), "Host IP is not allowed");
  assert.equal(validateSshHost("10.0.0.5"), "Host IP is not allowed");
  assert.equal(validateSshHost("192.168.1.10"), "Host IP is not allowed");
  assert.equal(validateSshHost("169.254.169.254"), "Host IP is not allowed");
  assert.equal(validateSshHost("localhost"), "Host is not allowed");
});

test("validateSshHost allows public hostnames and IPs", () => {
  assert.equal(validateSshHost("8.8.8.8"), null);
  assert.equal(validateSshHost("server.example.com"), null);
});

test("validateSshHost blocks IPv4-mapped private addresses", () => {
  assert.equal(validateSshHost("::ffff:127.0.0.1"), "Host IP is not allowed");
  assert.equal(validateSshHost("::ffff:10.0.0.5"), "Host IP is not allowed");
  assert.equal(validateSshHost("::ffff:169.254.169.254"), "Host IP is not allowed");
});

test("validateSshHost allows public IPv4-mapped addresses", () => {
  assert.equal(validateSshHost("::ffff:8.8.8.8"), null);
});

test("validateResolvedIp blocks private and metadata addresses", () => {
  assert.equal(validateResolvedIp("127.0.0.1"), "Resolved IP is not allowed");
  assert.equal(validateResolvedIp("10.0.0.5"), "Resolved IP is not allowed");
  assert.equal(validateResolvedIp("169.254.169.254"), "Resolved IP is not allowed");
});

test("validateResolvedIp allows public addresses", () => {
  assert.equal(validateResolvedIp("8.8.8.8"), null);
});

test("validateSshHost honors an explicit CIDR allowlist", () => {
  const policy: SshTargetPolicy = { allowDockerHost: false, allowedCidrs: ["10.0.0.0/8"] };
  assert.equal(validateSshHost("10.0.0.5", policy), null);
  assert.equal(validateSshHost("192.168.1.10", policy), "Host IP is not allowed");
  assert.equal(validateResolvedIp("10.0.0.5", policy), null);
});

test("validateSshHost blocks the docker host alias unless policy allows it", () => {
  assert.equal(validateSshHost("host.docker.internal"), "Host is not allowed");
  assert.equal(validateSshHost("metadata.google.internal"), "Host is not allowed");
  assert.equal(validateSshHost("172.17.0.1", { allowDockerHost: true, allowedCidrs: [] }), "Host IP is not allowed");

  const allowed: SshTargetPolicy = { allowDockerHost: true, allowedCidrs: [] };
  assert.equal(validateSshHost("host.docker.internal", allowed), null);
  assert.equal(validateSshHost("HOST.DOCKER.INTERNAL", allowed), null);
  assert.equal(validateSshHost("evil.internal", allowed), "Host is not allowed");
  assert.equal(validateSshHost("127.0.0.1", allowed), "Host IP is not allowed");
});

test("isAcceptableDockerHostGateway accepts RFC1918 and rejects loopback and public addresses", () => {
  assert.equal(isAcceptableDockerHostGateway("172.17.0.1"), true);
  assert.equal(isAcceptableDockerHostGateway("10.0.0.1"), true);
  assert.equal(isAcceptableDockerHostGateway("192.168.1.1"), true);
  assert.equal(isAcceptableDockerHostGateway("127.0.0.1"), false);
  assert.equal(isAcceptableDockerHostGateway("169.254.169.254"), false);
  assert.equal(isAcceptableDockerHostGateway("100.64.0.1"), false);
  assert.equal(isAcceptableDockerHostGateway("8.8.8.8"), false);
});

test("validateResolvedIp still blocks gateway literals when the docker host alias is allowed", () => {
  const allowed: SshTargetPolicy = { allowDockerHost: true, allowedCidrs: [] };
  assert.equal(validateResolvedIp("172.17.0.1", allowed), "Resolved IP is not allowed");
});
