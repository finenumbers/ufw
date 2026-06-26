import { alignImportCoreWithRemote } from "@/lib/imports/align-import-core";
import { dedupeImportRows } from "@/lib/imports/dedupe-import-rows";
import { computeFingerprint } from "@/lib/ufw/fingerprint";
import { generateId } from "@/lib/utils";
import type { ImportRuleRow } from "@/lib/validations/import";
import type { UnifiedRuleRow } from "@/types/rule";

function importRowToUnified(row: ImportRuleRow): UnifiedRuleRow {
  const core = alignImportCoreWithRemote(row);

  return {
    clientRowId: generateId(),
    fingerprint: computeFingerprint(core),
    sortOrder: 0,
    core,
    ui: {
      group: row.group ?? null,
      name: row.name ?? null,
      notes: row.notes ?? null,
    },
    originState: "DRAFT_ONLY",
    sources: { remote: false, local: false, draft: true },
  };
}

function mergeUiMetadata(
  existing: UnifiedRuleRow["ui"],
  imported: ImportRuleRow,
): UnifiedRuleRow["ui"] {
  return {
    group: imported.group ?? existing.group,
    name: imported.name ?? existing.name,
    notes: imported.notes ?? existing.notes,
  };
}

export function mergeImportWithDraftRows(
  existingRows: UnifiedRuleRow[],
  imported: ImportRuleRow[],
): { rows: UnifiedRuleRow[]; duplicateCount: number } {
  const { rows: dedupedImport, duplicateCount: fileDuplicateCount } = dedupeImportRows(imported);
  const existingByFingerprint = new Map(existingRows.map((row) => [row.fingerprint, row]));
  const merged: UnifiedRuleRow[] = [];
  const consumedFingerprints = new Set<string>();
  let mergedDuplicateCount = 0;

  for (const importRow of dedupedImport) {
    const fingerprint = computeFingerprint(alignImportCoreWithRemote(importRow));
    const existing = existingByFingerprint.get(fingerprint);

    if (existing) {
      mergedDuplicateCount += 1;
      merged.push({
        ...existing,
        ui: mergeUiMetadata(existing.ui, importRow),
      });
    } else {
      merged.push(importRowToUnified(importRow));
    }

    consumedFingerprints.add(fingerprint);
  }

  for (const row of existingRows) {
    if (!consumedFingerprints.has(row.fingerprint)) {
      merged.push(row);
    }
  }

  const rows = merged.map((row, index) => ({
    ...row,
    sortOrder: index,
  }));

  return {
    rows,
    duplicateCount: fileDuplicateCount + mergedDuplicateCount,
  };
}
