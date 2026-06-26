import { alignImportCoreWithRemote } from "@/lib/imports/align-import-core";
import { computeFingerprint } from "@/lib/ufw/fingerprint";
import type { ImportRuleRow } from "@/lib/validations/import";

export type DedupeImportResult = {
  rows: ImportRuleRow[];
  duplicateCount: number;
};

function importRowFingerprint(row: ImportRuleRow): string {
  return computeFingerprint(alignImportCoreWithRemote(row));
}

export function dedupeImportRows(rows: ImportRuleRow[]): DedupeImportResult {
  const seen = new Set<string>();
  const unique: ImportRuleRow[] = [];
  let duplicateCount = 0;

  for (const row of rows) {
    const fingerprint = importRowFingerprint(row);
    if (seen.has(fingerprint)) {
      duplicateCount += 1;
      continue;
    }

    seen.add(fingerprint);
    unique.push(row);
  }

  return { rows: unique, duplicateCount };
}
