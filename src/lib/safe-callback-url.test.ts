import assert from "node:assert/strict";
import test from "node:test";

import { safeCallbackUrl } from "@/lib/safe-callback-url";

test("safeCallbackUrl allows relative paths", () => {
  assert.equal(safeCallbackUrl("/servers"), "/servers");
  assert.equal(safeCallbackUrl("/servers/host.example.com"), "/servers/host.example.com");
});

test("safeCallbackUrl rejects open redirects", () => {
  assert.equal(safeCallbackUrl("//evil.example"), "/servers");
  assert.equal(safeCallbackUrl("https://evil.example"), "/servers");
  assert.equal(safeCallbackUrl("/\\evil"), "/servers");
  assert.equal(safeCallbackUrl("/%2F%2Fevil.example"), "/servers");
  assert.equal(safeCallbackUrl(null), "/servers");
});
