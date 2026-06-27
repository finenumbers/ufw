import { parseCsvRules } from "@/lib/imports/csv";
import { assertImportRowCount } from "@/lib/imports/import-limits";
import { parseJsonRules } from "@/lib/imports/json";
import { parseXlsxRules } from "@/lib/imports/xlsx";
import type { ImportRuleRow } from "@/lib/validations/import";

export type ImportFormat = "csv" | "xlsx" | "json";

function finalizeImportRows(rows: ImportRuleRow[]): ImportRuleRow[] {
  assertImportRowCount(rows.length);
  return rows;
}

export async function parseImportFile(
  content: string | ArrayBuffer,
  format: ImportFormat,
): Promise<ImportRuleRow[]> {
  switch (format) {
    case "csv":
      return finalizeImportRows(parseCsvRules(content as string));
    case "json":
      return finalizeImportRows(parseJsonRules(content as string));
    case "xlsx":
      return finalizeImportRows(parseXlsxRules(content as ArrayBuffer));
    default:
      throw new Error(`Unsupported import format: ${format}`);
  }
}

export function detectImportFormat(filename: string): ImportFormat | null {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".csv")) return "csv";
  if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) return "xlsx";
  if (lower.endsWith(".json")) return "json";
  return null;
}
