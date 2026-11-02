import assert from "node:assert/strict";
import test from "node:test";

import { sanitizeRemoteOperationError, sanitizeSshClientError } from "@/lib/errors/sanitize";

test("sanitizeSshClientError keeps an AmneziaWG removal message", () => {
  assert.equal(
    sanitizeSshClientError(new Error("AmneziaWG route was removed for this node")),
    "AmneziaWG route was removed for this node",
  );
});

test("sanitizeSshClientError keeps host validation messages", () => {
  assert.equal(
    sanitizeSshClientError(new Error("Host is not allowed")),
    "Host is not allowed",
  );
  assert.equal(
    sanitizeSshClientError(new Error("Host IP is not allowed")),
    "Host IP is not allowed",
  );
  assert.equal(
    sanitizeSshClientError(new Error("Resolved IP is not allowed")),
    "Resolved IP is not allowed",
  );
  assert.equal(
    sanitizeSshClientError(new Error("Docker host alias did not resolve")),
    "Docker host alias did not resolve",
  );
});

const SSH_SAVE_FAILURE = "SSH connection failed. Check host, credentials, and network access.";

test("sanitizeRemoteOperationError keeps the AmneziaWG endpoint refusal", () => {
  assert.equal(
    sanitizeRemoteOperationError(
      new Error("Use the node address inside the VPN, not the Amnezia endpoint"),
      SSH_SAVE_FAILURE,
    ),
    "Use the node address inside the VPN, not the Amnezia endpoint",
  );
});

test("sanitizeRemoteOperationError hides resolver and route command text", () => {
  assert.equal(
    sanitizeRemoteOperationError(new Error("getaddrinfo ENOTFOUND latvia.gate.example"), SSH_SAVE_FAILURE),
    SSH_SAVE_FAILURE,
  );
  assert.equal(
    sanitizeRemoteOperationError(
      new Error("RTNETLINK answers: Network is unreachable"),
      SSH_SAVE_FAILURE,
    ),
    SSH_SAVE_FAILURE,
  );
});

test("sanitizeSshClientError still hides unknown SSH client failures", () => {
  assert.equal(
    sanitizeSshClientError(new Error("connect ECONNREFUSED 203.0.113.10:22")),
    "SSH connection failed. Check host, credentials, and network access.",
  );
});