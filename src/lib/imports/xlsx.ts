import * as XLSX from "xlsx";

import { assertImportRowCount, MAX_IMPORT_ROWS } from "@/lib/imports/import-limits";
import { normalizeImportRow } from "@/lib/imports/normalize-row";
import type { ImportRuleRow } from "@/lib/validations/import";

export function parseXlsxRules(content: ArrayBuffer): ImportRuleRow[] {
  const workbook = XLSX.read(content, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error("XLSX file has no sheets");
  }

  const sheet = workbook.Sheets[sheetName];
  const ref = sheet["!ref"];
  if (ref) {
    const range = XLSX.utils.decode_range(ref);
    const rowCount = range.e.r - range.s.r + 1;
    assertImportRowCount(rowCount);
  }

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    range: 0,
    blankrows: false,
  });

  if (rows.length > MAX_IMPORT_ROWS) {
    assertImportRowCount(rows.length);
  }

  return rows.map((row) => normalizeImportRow(row));
}
