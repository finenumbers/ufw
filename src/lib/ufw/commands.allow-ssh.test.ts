import assert from "node:assert/strict";
import test from "node:test";

import { buildAllowSshCommand } from "@/lib/ufw/commands";

test("buildAllowSshCommand uses explicit tcp port", () => {
  assert.equal(buildAllowSshCommand(22), "ufw allow 22/tcp");
  assert.equal(buildAllowSshCommand(2222), "ufw allow 2222/tcp");
});
