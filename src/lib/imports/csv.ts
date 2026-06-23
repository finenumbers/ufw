import Papa from "papaparse";

import { normalizeImportRow } from "@/lib/imports/normalize-row";
import type { ImportRuleRow } from "@/lib/validations/import";

export function parseCsvRules(content: string): ImportRuleRow[] {
  const parsed = Papa.parse<Record<string, string>>(content, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0) {
    throw new Error(parsed.errors[0]?.message ?? "CSV parse error");
  }

  return parsed.data.map((row) => normalizeImportRow(row));
}
