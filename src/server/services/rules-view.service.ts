import type { RuleOriginState } from "@prisma/client";

import { db } from "@/lib/db";
import { mergeRulesByFingerprint } from "@/lib/ufw/diff";
import { originStateToSources, resolveRuleOriginState } from "@/lib/ufw/origin-state";
import { generateId } from "@/lib/utils";
import type { RuleCore, UnifiedRuleRow } from "@/types/rule";
import {
  captureSnapshot,
  getLatestSnapshot,
  snapshotRulesToParsed,
} from "@/server/services/snapshot.service";
import {
  getDraftRules,
  getOrCreateDraftSession,
  hasProtectedDraftChanges,
  seedDraftFromUnifiedRules,
} from "@/server/services/draft.service";
import { semanticStep } from "@/server/services/operation-progress.service";
import { detectUfwState } from "@/server/services/ssh.service";

function recordToUnified(row: {
  fingerprint: string;
  sortOrder: number;
  action: RuleCore["action"];
  direction: RuleCore["direction"];
  interface: string | null;
  protocol: RuleCore["protocol"];
  fromAddress: string | null;
  fromPort: string | null;
  toAddress: string | null;
  toPort: string | null;
  appName: string | null;
  logMode: RuleCore["logMode"];
  ruleComment: string | null;
  ipv6: boolean;
  group?: string | null;
  name?: string | null;
  notes?: string | null;
  rawLine?: string | null;
}, originState: RuleOriginState, sources: UnifiedRuleRow["sources"]): UnifiedRuleRow {
  return {
    clientRowId: generateId(),
    fingerprint: row.fingerprint,
    sortOrder: row.sortOrder,
    core: {
      action: row.action,
      direction: row.direction,
      interface: row.interface,
      protocol: row.protocol,
      fromAddress: row.fromAddress,
      fromPort: row.fromPort,
      toAddress: row.toAddress,
      toPort: row.toPort,
      appName: row.appName,
      logMode: row.logMode,
      ruleComment: row.ruleComment,
      ipv6: row.ipv6,
    },
    ui: {
      group: row.group,
      name: row.name,
      notes: row.notes,
    },
    originState,
    sources,
    rawLine: row.rawLine,
  };
}

export async function syncDraftFromRemoteSnapshot(
  serverId: string,
  userId: string,
  options?: { force?: boolean },
): Promise<{ skipped: boolean }> {
  if (!options?.force && (await hasProtectedDraftChanges(serverId, userId))) {
    return { skipped: true };
  }

  const snapshot = await getLatestSnapshot(serverId);
  if (!snapshot) return { skipped: false };

  const rows = snapshot.rules.map((rule) =>
    recordToUnified(
      { ...rule, rawLine: rule.rawLine },
      "REMOTE_ONLY",
      { remote: true, local: false, draft: false },
    ),
  );

  await seedDraftFromUnifiedRules(serverId, userId, rows);
  return { skipped: false };
}

export function remoteSnapshotOutOfSync(
  snapshot: { rules: Array<{ fingerprint: string }> } | null,
  remoteRules: Array<{ fingerprint: string }>,
): boolean {
  if (!snapshot) {
    return remoteRules.length > 0;
  }

  const snapshotFingerprints = [...new Set(snapshot.rules.map((rule) => rule.fingerprint))].sort();
  const remoteFingerprints = [...new Set(remoteRules.map((rule) => rule.fingerprint))].sort();

  if (snapshotFingerprints.length !== remoteFingerprints.length) {
    return true;
  }

  return snapshotFingerprints.some(
    (fingerprint, index) => fingerprint !== remoteFingerprints[index],
  );
}

export async function refreshRemoteRules(
  serverId: string,
  userId: string,
  tracker?: import("@/server/services/operation-progress.service").OperationTracker,
  options?: { forceDraft?: boolean },
): Promise<{ draftSkipped: boolean }> {
  const queueOptions = tracker
    ? {
        onStart: async () => {
          await tracker.markRunning();
          await tracker.startStep("load_ufw", semanticStep("load_ufw", "steps.load_ufw"));
        },
      }
    : undefined;

  await captureSnapshot(serverId, userId, queueOptions);

  if (tracker) {
    await tracker.completeStep("load_ufw");
    await tracker.startStep("draft_sync", semanticStep("draft_sync", "steps.draft_sync"));
  }

  const draftSync = await syncDraftFromRemoteSnapshot(serverId, userId, {
    force: options?.forceDraft,
  });

  if (tracker) {
    await tracker.completeStep("draft_sync");
  }

  return { draftSkipped: draftSync.skipped };
}

export async function buildUnifiedRulesView(
  serverId: string,
  userId: string,
): Promise<UnifiedRuleRow[]> {
  const snapshot = await getLatestSnapshot(serverId);
  const localRecords = await db.ruleRecord.findMany({
    where: { serverId },
    orderBy: { sortOrder: "asc" },
  });

  const remoteRows: UnifiedRuleRow[] = snapshot
    ? snapshot.rules.map((rule) =>
        recordToUnified(
          { ...rule, rawLine: rule.rawLine },
          "REMOTE_ONLY",
          { remote: true, local: false, draft: false },
        ),
      )
    : [];

  const localRows: UnifiedRuleRow[] = localRecords.map((rule) =>
    recordToUnified(rule, "LOCAL_ONLY", { remote: false, local: true, draft: false }),
  );

  const merged = mergeRulesByFingerprint(remoteRows, localRows);

  const draftSession = await getOrCreateDraftSession(serverId, userId);
  if (draftSession.rules.length === 0) {
    await seedDraftFromUnifiedRules(serverId, userId, merged);
  }

  const draftRules = await getDraftRules(serverId, userId);
  const remoteFingerprints = new Set(snapshot?.rules.map((rule) => rule.fingerprint) ?? []);
  const localFingerprints = new Set(localRecords.map((rule) => rule.fingerprint));

  return draftRules
    .filter((rule) => !rule.isDeleted)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((rule) => {
      const originState = resolveRuleOriginState(
        rule.fingerprint,
        remoteFingerprints,
        localFingerprints,
      );

      return {
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
        ui: {
          group: rule.group,
          name: rule.name,
          notes: rule.notes,
        },
        originState,
        sources: originStateToSources(originState),
        isDeleted: rule.isDeleted,
      };
    });
}

export async function getRemoteParsedRules(serverId: string) {
  const snapshot = await getLatestSnapshot(serverId);
  if (!snapshot) return [];
  return snapshotRulesToParsed(snapshot.rules);
}

export async function getLiveRemoteParsedRules(serverId: string) {
  const detection = await detectUfwState(serverId);
  return detection.rules;
}
