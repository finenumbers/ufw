import { dedupeImportRows } from "@/lib/imports/dedupe-import-rows";
import { computeFingerprint } from "@/lib/ufw/fingerprint";
import { generateId } from "@/lib/utils";
import type { ImportRuleRow } from "@/lib/validations/import";
import type { UnifiedRuleRow } from "@/types/rule";
import { createAuditEvent } from "@/server/services/audit.service";
import {
  getDraftRules,
  getOrCreateDraftSession,
  updateDraftRules,
} from "@/server/services/draft.service";

function importRowToUnified(row: ImportRuleRow, sortOrder: number): UnifiedRuleRow {
  const core = {
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
  };

  return {
    clientRowId: generateId(),
    fingerprint: computeFingerprint(core),
    sortOrder,
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

export async function importRulesToDraft(
  serverId: string,
  userId: string,
  imported: ImportRuleRow[],
): Promise<{ rows: UnifiedRuleRow[]; duplicateCount: number }> {
  const { rows: dedupedRows, duplicateCount } = dedupeImportRows(imported);

  await getOrCreateDraftSession(serverId, userId);
  const existing = await getDraftRules(serverId, userId);

  const existingRows: UnifiedRuleRow[] = existing
    .filter((r) => !r.isDeleted)
    .map((rule) => ({
      clientRowId: rule.clientRowId,
      fingerprint: rule.fingerprint,
      sortOrder: rule.sortOrder,
      core: {
        action: rule.action,
        direction: rule.direction,
        interface: rule.interface,
        protocol: rule.protocol,
        fromAddress: rule.fromAddress,
        fromPort: rule.fromPort,
        toAddress: rule.toAddress,
        toPort: rule.toPort,
        appName: rule.appName,
        logMode: rule.logMode,
        ruleComment: rule.ruleComment,
        ipv6: rule.ipv6,
      },
      ui: { group: rule.group, name: rule.name, notes: rule.notes },
      originState: rule.originState,
      sources: {
        remote: false,
        local: false,
        draft: true,
      },
    }));

  const startOrder = existingRows.length;
  const importedRows = dedupedRows.map((row, index) =>
    importRowToUnified(row, startOrder + index),
  );

  const merged = [...existingRows, ...importedRows];
  await updateDraftRules(serverId, userId, merged);

  await createAuditEvent({
    userId,
    action: "RULES_IMPORTED",
    entityType: "server",
    entityId: serverId,
    metadata: { importedCount: dedupedRows.length, duplicateCount },
  });

  return { rows: merged, duplicateCount };
}
