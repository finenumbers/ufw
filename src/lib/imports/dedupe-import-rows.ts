import { computeFingerprint } from "@/lib/ufw/fingerprint";
import type { ImportRuleRow } from "@/lib/validations/import";

export type DedupeImportResult = {
  rows: ImportRuleRow[];
  duplicateCount: number;
};

function importRowFingerprint(row: ImportRuleRow): string {
  return computeFingerprint({
    action: row.action,
    direction: row.direction ?? null,
    interface: row.interface ?? null,
    protocol: row.protocol ?? null,
    fromAddress: row.fromAddress ?? null,
    fromPort: row.fromPort ?? null,
    toAddress: row.toAddress ?? null,
    toPort: row.toPort ?? null,
    appName: row.appName ?? null,
    logMode: row.logMode ?? "NONE",
    ruleComment: row.ruleComment ?? null,
    ipv6: row.ipv6 ?? false,
  });
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
