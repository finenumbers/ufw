import assert from "node:assert/strict";
import test from "node:test";

import { SESSION_EXPIRED_ERROR, unauthorizedActionFailure } from "@/lib/auth/require-user";

test("unauthorizedActionFailure returns session expired message", () => {
  assert.deepEqual(unauthorizedActionFailure(), {
    success: false,
    error: SESSION_EXPIRED_ERROR,
  });
});
