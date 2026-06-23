import { parseCsvRules } from "@/lib/imports/csv";
import { parseJsonRules } from "@/lib/imports/json";
import { parseXlsxRules } from "@/lib/imports/xlsx";
import type { ImportRuleRow } from "@/lib/validations/import";

export type ImportFormat = "csv" | "xlsx" | "json";

export async function parseImportFile(
  content: string | ArrayBuffer,
  format: ImportFormat,
): Promise<ImportRuleRow[]> {
  switch (format) {
    case "csv":
      return parseCsvRules(content as string);
    case "json":
      return parseJsonRules(content as string);
    case "xlsx":
      return parseXlsxRules(content as ArrayBuffer);
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
