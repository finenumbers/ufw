import * as XLSX from "xlsx";

import { normalizeImportRow } from "@/lib/imports/normalize-row";
import type { ImportRuleRow } from "@/lib/validations/import";

export function parseXlsxRules(content: ArrayBuffer): ImportRuleRow[] {
  const workbook = XLSX.read(content, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error("XLSX file has no sheets");
  }

  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

  return rows.map((row) => normalizeImportRow(row));
}
