import type { ImportRuleRow } from "@/lib/validations/import";
import { RULES_FILE_COLUMNS, type RulesFileColumn } from "@/lib/rules/file-columns";
import type { UnifiedRuleRow } from "@/types/rule";

export function unifiedRowToImportRow(row: UnifiedRuleRow): ImportRuleRow {
  const mapped: ImportRuleRow = {
    action: row.core.action,
    logMode: row.core.logMode,
    ipv6: row.core.ipv6,
  };

  if (row.core.direction) mapped.direction = row.core.direction;
  if (row.core.interface) mapped.interface = row.core.interface;
  if (row.core.protocol) mapped.protocol = row.core.protocol;
  if (row.core.fromAddress) mapped.fromAddress = row.core.fromAddress;
  if (row.core.fromPort) mapped.fromPort = row.core.fromPort;
  if (row.core.toAddress) mapped.toAddress = row.core.toAddress;
  if (row.core.toPort) mapped.toPort = row.core.toPort;
  if (row.core.appName) mapped.appName = row.core.appName;
  if (row.core.ruleComment) mapped.ruleComment = row.core.ruleComment;
  if (row.ui.group) mapped.group = row.ui.group;
  if (row.ui.name) mapped.name = row.ui.name;
  if (row.ui.notes) mapped.notes = row.ui.notes;

  return mapped;
}

export function unifiedRowsToImportRows(rows: UnifiedRuleRow[]): ImportRuleRow[] {
  return [...rows]
    .filter((row) => !row.isDeleted)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(unifiedRowToImportRow);
}

function importRowToSheetRow(row: ImportRuleRow): Record<RulesFileColumn, string | boolean | undefined> {
  return {
    group: row.group,
    name: row.name,
    action: row.action,
    direction: row.direction,
    interface: row.interface,
    fromAddress: row.fromAddress,
    fromPort: row.fromPort,
    toAddress: row.toAddress,
    toPort: row.toPort,
    protocol: row.protocol,
    logMode: row.logMode ?? "NONE",
    ipv6: row.ipv6 ?? false,
    appName: row.appName,
    ruleComment: row.ruleComment,
    notes: row.notes,
  };
}

export async function exportRulesToXlsxBuffer(rows: UnifiedRuleRow[]): Promise<ArrayBuffer> {
  const XLSX = await import("xlsx");
  const sheetRows = unifiedRowsToImportRows(rows).map(importRowToSheetRow);
  const worksheet = XLSX.utils.json_to_sheet(sheetRows, { header: [...RULES_FILE_COLUMNS] });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Rules");

  return XLSX.write(workbook, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
}

export function buildRulesExportFilename(date = new Date()): string {
  const day = date.toISOString().slice(0, 10);
  return `ufw-rules-${day}.xlsx`;
}
