import assert from "node:assert/strict";
import test from "node:test";

import {
  assertImportFileSize,
  assertImportRowCount,
  MAX_IMPORT_FILE_BYTES,
} from "@/lib/imports/import-limits";

test("assertImportFileSize accepts files within limit", () => {
  assert.doesNotThrow(() => assertImportFileSize(MAX_IMPORT_FILE_BYTES));
});

test("assertImportFileSize rejects oversized files", () => {
  assert.throws(
    () => assertImportFileSize(MAX_IMPORT_FILE_BYTES + 1),
    /too large/i,
  );
});

test("assertImportRowCount rejects oversized row sets", () => {
  assert.throws(
    () => assertImportRowCount(10_001),
    /too many rows/i,
  );
});
