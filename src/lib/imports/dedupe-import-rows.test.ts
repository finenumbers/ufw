import assert from "node:assert/strict";
import test from "node:test";

import { dedupeImportRows } from "@/lib/imports/dedupe-import-rows";
import type { ImportRuleRow } from "@/lib/validations/import";

const baseRow: ImportRuleRow = {
  action: "ALLOW",
  direction: "IN",
  toPort: "22",
  protocol: "TCP",
  logMode: "NONE",
  ipv6: false,
  group: "SSH",
  name: "Allow SSH",
};

test("dedupeImportRows keeps first occurrence by fingerprint", () => {
  const duplicate: ImportRuleRow = {
    ...baseRow,
    name: "Duplicate label",
    notes: "second row",
  };

  const result = dedupeImportRows([baseRow, duplicate, { ...baseRow, toPort: "443" }]);

  assert.equal(result.rows.length, 2);
  assert.equal(result.duplicateCount, 1);
  assert.equal(result.rows[0]?.name, "Allow SSH");
  assert.equal(result.rows[1]?.toPort, "443");
});
