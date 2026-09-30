import assert from "node:assert/strict";
import test from "node:test";

import { sanitizeSshClientError } from "@/lib/errors/sanitize";

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

test("sanitizeSshClientError still hides unknown SSH client failures", () => {
  assert.equal(
    sanitizeSshClientError(new Error("connect ECONNREFUSED 203.0.113.10:22")),
    "SSH connection failed. Check host, credentials, and network access.",
  );
});