import assert from "node:assert/strict";
import test from "node:test";

import { createExportToken, verifyExportToken } from "@/lib/export-token";

test("createExportToken verifies for same user before expiry", () => {
  const userId = "user-123";
  const token = createExportToken(userId);
  assert.equal(verifyExportToken(token, userId), true);
  assert.equal(verifyExportToken(token, "other-user"), false);
});

test("verifyExportToken rejects tampered token", () => {
  const token = createExportToken("user-123");
  const tampered = token.slice(0, -2) + (token.endsWith("A") ? "B" : "A");
  assert.equal(verifyExportToken(tampered, "user-123"), false);
});
