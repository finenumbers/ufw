import { mergeImportWithDraftRows } from "@/lib/imports/merge-import-with-draft";
import type { ImportRuleRow } from "@/lib/validations/import";
import type { UnifiedRuleRow } from "@/types/rule";
import { createAuditEvent } from "@/server/services/audit.service";
import {
  getDraftRules,
  getOrCreateDraftSession,
  replaceDraftSessionRules,
} from "@/server/services/draft.service";

export async function importRulesToDraft(
  serverId: string,
  userId: string,
  imported: ImportRuleRow[],
): Promise<{ rows: UnifiedRuleRow[]; duplicateCount: number }> {
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

  const { rows: merged, duplicateCount } = mergeImportWithDraftRows(existingRows, imported);
  await replaceDraftSessionRules(serverId, userId, merged);

  await createAuditEvent({
    userId,
    action: "RULES_IMPORTED",
    entityType: "server",
    entityId: serverId,
    metadata: { importedCount: imported.length, duplicateCount },
  });

  return { rows: merged, duplicateCount };
}
