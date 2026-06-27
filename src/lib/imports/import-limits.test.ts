import assert from "node:assert/strict";
import test from "node:test";

import { assertConfigEntryCounts } from "@/lib/imports/import-limits";
import { validateImportedRuleRows } from "@/lib/validations/import";

test("validateImportedRuleRows rejects invalid port values", () => {
  const error = validateImportedRuleRows([
    {
      action: "ALLOW",
      toPort: "any",
    },
  ]);

  assert.match(error ?? "", /Row 1:/);
});

test("assertConfigEntryCounts rejects oversized server lists", () => {
  assert.throws(
    () => assertConfigEntryCounts(0, 501),
    /too many servers/,
  );
});
