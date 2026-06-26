import assert from "node:assert/strict";
import test from "node:test";

import { SERVER_DUPLICATE_ERROR } from "@/server/services/server.service";

test("SERVER_DUPLICATE_ERROR is a stable sentinel for duplicate server handling", () => {
  assert.equal(SERVER_DUPLICATE_ERROR, "SERVER_DUPLICATE");
});
