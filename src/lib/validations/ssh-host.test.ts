import assert from "node:assert/strict";
import test from "node:test";

import { validateSshHost } from "@/lib/validations/ssh-host";

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

test("validateSshHost honors SSH_ALLOWED_CIDRS allowlist", () => {
  const previous = process.env.SSH_ALLOWED_CIDRS;
  process.env.SSH_ALLOWED_CIDRS = "10.0.0.0/8";

  try {
    assert.equal(validateSshHost("10.0.0.5"), null);
    assert.equal(validateSshHost("192.168.1.10"), "Host IP is not allowed");
  } finally {
    if (previous === undefined) {
      delete process.env.SSH_ALLOWED_CIDRS;
    } else {
      process.env.SSH_ALLOWED_CIDRS = previous;
    }
  }
});
