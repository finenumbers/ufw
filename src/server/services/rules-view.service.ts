import type { DraftRule, RuleOriginState } from "@prisma/client";

import { db } from "@/lib/db";
import { TABLE_PAGE_SIZE } from "@/lib/pagination/table-page-size";
import { originStateToSources, resolveRuleOriginState } from "@/lib/ufw/origin-state";
import { generateId } from "@/lib/utils";
import type { RuleCore, UnifiedRuleRow } from "@/types/rule";
import type { UfwDetectionResult } from "@/types/ufw";
import {
  captureSnapshot,
  getLatestSnapshot,
  persistSnapshotFromDetection,
} from "@/server/services/snapshot.service";
import {
  getOrCreateDraftSession,
  seedDraftFromUnifiedRules,
  syncDraftOriginStates,
} from "@/server/services/draft.service";
import { runForServer } from "@/lib/queue/queue-registry";
import { semanticStep } from "@/server/services/operation-progress.service";
import { detectUfwState } from "@/server/services/ssh.service";

type SnapshotRuleRow = {
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
  rawLine?: string | null;
};

type DraftRuleRow = SnapshotRuleRow & {
  isDeleted: boolean;
  originState: RuleOriginState;
  group: string | null;
  name: string | null;
  notes: string | null;
  clientRowId: string;
};

type LocalRuleRecord = SnapshotRuleRow & {
  group: string | null;
  name: string | null;
  notes: string | null;
};

function recordToUnified(
  row: {
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
    clientRowId?: string;
    ufwRuleNumber?: number | null;
  },
  originState: RuleOriginState,
  sources: UnifiedRuleRow["sources"],
): UnifiedRuleRow {
  return {
    clientRowId: row.clientRowId ?? generateId(),
    fingerprint: row.fingerprint,
    sortOrder: row.sortOrder,
    ufwRuleNumber: row.ufwRuleNumber ?? null,
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

export function buildTableRowsFromSources(
  snapshotRules: SnapshotRuleRow[],
  localRecords: LocalRuleRecord[],
): UnifiedRuleRow[] {
  const remoteFingerprints = new Set(snapshotRules.map((rule) => rule.fingerprint));
  const localFingerprints = new Set(localRecords.map((rule) => rule.fingerprint));
  const metadataByFingerprint = new Map(
    localRecords.map((record) => [
      record.fingerprint,
      { group: record.group, name: record.name, notes: record.notes },
    ]),
  );

  const rows: UnifiedRuleRow[] = [];

  for (const snapshotRule of snapshotRules) {
    const metadata: { group?: string | null; name?: string | null; notes?: string | null } =
      metadataByFingerprint.get(snapshotRule.fingerprint) ?? {};
    const originState = resolveRuleOriginState(
      snapshotRule.fingerprint,
      remoteFingerprints,
      localFingerprints,
    );

    rows.push(
      recordToUnified(
        {
          ...snapshotRule,
          sortOrder: rows.length,
          ufwRuleNumber: snapshotRule.sortOrder + 1,
          group: metadata.group,
          name: metadata.name,
          notes: metadata.notes,
          rawLine: snapshotRule.rawLine,
        },
        originState,
        originStateToSources(originState),
      ),
    );
  }

  const localOnlyRecords = localRecords
    .filter((record) => !remoteFingerprints.has(record.fingerprint))
    .sort((left, right) => left.sortOrder - right.sortOrder);

  for (const record of localOnlyRecords) {
    rows.push(
      recordToUnified(
        {
          ...record,
          sortOrder: rows.length,
          ufwRuleNumber: null,
        },
        "LOCAL_ONLY",
        originStateToSources("LOCAL_ONLY"),
      ),
    );
  }

  return rows;
}

async function rebuildTableFromSources(
  serverId: string,
  userId: string,
): Promise<UnifiedRuleRow[]> {
  const snapshot = await getLatestSnapshot(serverId);
  const localRecords = await db.ruleRecord.findMany({
    where: { serverId },
    orderBy: { sortOrder: "asc" },
  });

  const rows = snapshot
    ? buildTableRowsFromSources(snapshot.rules, localRecords)
    : localRecords.map((record, index) =>
        recordToUnified(
          { ...record, sortOrder: index },
          "LOCAL_ONLY",
          originStateToSources("LOCAL_ONLY"),
        ),
      );

  await seedDraftFromUnifiedRules(serverId, userId, rows, { savedAt: null });
  await syncDraftOriginStates(serverId, userId);
  return rows;
}

async function syncDraftFromRemoteSnapshot(
  serverId: string,
  userId: string,
): Promise<{ skipped: boolean }> {
  const snapshot = await getLatestSnapshot(serverId);
  if (!snapshot) {
    return { skipped: false };
  }

  await rebuildTableFromSources(serverId, userId);
  return { skipped: false };
}


export async function refreshRemoteRules(
  serverId: string,
  userId: string,
  tracker?: import("@/server/services/operation-progress.service").OperationTracker,
  detection?: UfwDetectionResult,
): Promise<void> {
  const queueOptions = tracker
    ? {
        onStart: async () => {
          await tracker.markRunning();
          if (!detection) {
            await tracker.startStep("load_ufw", semanticStep("load_ufw", "steps.load_ufw"));
          }
        },
      }
    : undefined;

  await runForServer(
    serverId,
    async () => {
      if (detection) {
        if (tracker) {
          await tracker.startStep("load_ufw", semanticStep("load_ufw", "steps.load_ufw"));
        }
        await persistSnapshotFromDetection(serverId, userId, detection);
        if (tracker) {
          await tracker.completeStep("load_ufw");
        }
      } else {
        await captureSnapshot(serverId, userId, { skipQueue: true });
        if (tracker) {
          await tracker.completeStep("load_ufw");
        }
      }

      if (tracker) {
        await tracker.startStep("draft_sync", semanticStep("draft_sync", "steps.draft_sync"));
      }

      await syncDraftFromRemoteSnapshot(serverId, userId);

      if (tracker) {
        await tracker.completeStep("draft_sync");
      }
    },
    queueOptions,
  );
}

export type RulesViewPage = {
  rows: UnifiedRuleRow[];
  total: number;
  hasMore: boolean;
  nextOffset: number;
};

function mapDraftRuleEntity(rule: DraftRule): DraftRuleRow {
  return {
    fingerprint: rule.fingerprint,
    sortOrder: rule.sortOrder,
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
    group: rule.group,
    name: rule.name,
    notes: rule.notes,
    isDeleted: rule.isDeleted,
    originState: rule.originState,
    clientRowId: rule.clientRowId,
  };
}

async function ensureDraftRulesViewContext(serverId: string, userId: string) {
  const snapshot = await getLatestSnapshot(serverId);
  const localRecords = await db.ruleRecord.findMany({
    where: { serverId },
    orderBy: { sortOrder: "asc" },
    select: { fingerprint: true },
  });

  const session = await getOrCreateDraftSession(serverId, userId, { includeRules: false });
  const draftCount = await db.draftRule.count({
    where: { draftSessionId: session.id, isDeleted: false },
  });

  if (draftCount === 0) {
    await rebuildTableFromSources(serverId, userId);
  }

  const remoteFingerprints = new Set(snapshot?.rules.map((rule) => rule.fingerprint) ?? []);
  const localFingerprints = new Set(localRecords.map((rule) => rule.fingerprint));
  const ufwNumberByFingerprint = new Map(
    (snapshot?.rules ?? []).map((rule) => [rule.fingerprint, rule.sortOrder + 1]),
  );

  return {
    sessionId: session.id,
    remoteFingerprints,
    localFingerprints,
    ufwNumberByFingerprint,
  };
}

export async function buildUnifiedRulesViewPage(
  serverId: string,
  userId: string,
  offset: number,
  limit: number = TABLE_PAGE_SIZE,
): Promise<RulesViewPage> {
  const context = await ensureDraftRulesViewContext(serverId, userId);
  const where = { draftSessionId: context.sessionId, isDeleted: false };

  const [draftRules, total] = await Promise.all([
    db.draftRule.findMany({
      where,
      orderBy: { sortOrder: "asc" },
      skip: offset,
      take: limit,
    }),
    db.draftRule.count({ where }),
  ]);

  const rows = draftRulesToUnifiedRows(
    draftRules.map(mapDraftRuleEntity),
    context.remoteFingerprints,
    context.localFingerprints,
    context.ufwNumberByFingerprint,
  );

  const nextOffset = offset + rows.length;
  return {
    rows,
    total,
    hasMore: nextOffset < total,
    nextOffset,
  };
}

function draftRulesToUnifiedRows(
  draftRules: DraftRuleRow[],
  remoteFingerprints: Set<string>,
  localFingerprints: Set<string>,
  ufwNumberByFingerprint: Map<string, number>,
): UnifiedRuleRow[] {
  return draftRules
    .filter((rule) => !rule.isDeleted)
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((rule) => {
      const originState = resolveRuleOriginState(
        rule.fingerprint,
        remoteFingerprints,
        localFingerprints,
      );

      return recordToUnified(
        {
          ...rule,
          ufwRuleNumber: ufwNumberByFingerprint.get(rule.fingerprint) ?? null,
        },
        originState,
        originStateToSources(originState),
      );
    });
}

export async function getLiveRemoteParsedRules(serverId: string) {
  const detection = await detectUfwState(serverId);
  return detection.rules;
}
