import assert from "node:assert/strict";
import test from "node:test";

import { getClientIp } from "@/lib/rate-limit";

test("getClientIp ignores forwarded headers unless TRUST_PROXY=1", () => {
  const headers = new Headers({
    "x-forwarded-for": "203.0.113.10, 10.0.0.1",
    "x-real-ip": "203.0.113.10",
  });

  assert.equal(getClientIp(headers), "direct");
});

test("getClientIp reads x-forwarded-for when TRUST_PROXY=1", () => {
  const previous = process.env.TRUST_PROXY;
  process.env.TRUST_PROXY = "1";

  try {
    const headers = new Headers({
      "x-forwarded-for": "203.0.113.10, 10.0.0.1",
    });
    assert.equal(getClientIp(headers), "203.0.113.10");
  } finally {
    if (previous === undefined) {
      delete process.env.TRUST_PROXY;
    } else {
      process.env.TRUST_PROXY = previous;
    }
  }
});
