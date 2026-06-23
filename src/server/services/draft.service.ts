import type { TagKind } from "@prisma/client";

import { db } from "@/lib/db";
import { computeFingerprint } from "@/lib/ufw/fingerprint";
import { resolveRuleOriginState } from "@/lib/ufw/origin-state";
import { generateId } from "@/lib/utils";
import type { RuleDraftInput } from "@/types/rule";
import { createAuditEvent } from "@/server/services/audit.service";
import { getLatestSnapshot } from "@/server/services/snapshot.service";

function resolveDraftOriginState(
  row: RuleDraftInput,
  remoteFingerprints: Set<string>,
  localFingerprints: Set<string>,
) {
  const fingerprint = row.fingerprint || computeFingerprint(row.core);
  return resolveRuleOriginState(fingerprint, remoteFingerprints, localFingerprints);
}

export async function getOrCreateDraftSession(serverId: string, userId: string) {
  return db.$transaction(async (tx) => {
    const existing = await tx.draftSession.findFirst({
      where: { serverId, userId, isActive: true },
      include: { rules: { orderBy: { sortOrder: "asc" } } },
    });

    if (existing) {
      return existing;
    }

    return tx.draftSession.create({
      data: { serverId, userId, isActive: true },
      include: { rules: { orderBy: { sortOrder: "asc" } } },
    });
  });
}

export async function hasProtectedDraftChanges(
  serverId: string,
  userId: string,
): Promise<boolean> {
  const session = await db.draftSession.findFirst({
    where: { serverId, userId, isActive: true },
    include: { rules: { where: { isDeleted: false } } },
  });

  if (!session || session.rules.length === 0) {
    return false;
  }

  if (!session.savedAt) {
    return true;
  }

  if (session.updatedAt > session.savedAt) {
    return true;
  }

  const snapshot = await getLatestSnapshot(serverId);
  const snapshotFingerprints = new Set(
    snapshot?.rules.map((rule) => rule.fingerprint) ?? [],
  );

  for (const rule of session.rules) {
    if (rule.originState === "DRAFT_ONLY" || rule.originState === "LOCAL_ONLY") {
      return true;
    }

    if (!snapshotFingerprints.has(rule.fingerprint)) {
      return true;
    }
  }

  return false;
}

export async function seedDraftFromUnifiedRules(
  serverId: string,
  userId: string,
  rows: RuleDraftInput[],
) {
  await db.draftSession.updateMany({
    where: { serverId, userId, isActive: true },
    data: { isActive: false },
  });

  const session = await db.draftSession.create({
    data: {
      serverId,
      userId,
      isActive: true,
      savedAt: new Date(),
      rules: {
        create: rows.map((row, index) => ({
          clientRowId: row.clientRowId || generateId(),
          fingerprint: row.fingerprint || computeFingerprint(row.core),
          sortOrder: row.sortOrder ?? index,
          action: row.core.action,
          direction: row.core.direction ?? null,
          interface: row.core.interface ?? null,
          protocol: row.core.protocol ?? null,
          fromAddress: row.core.fromAddress ?? null,
          fromPort: row.core.fromPort ?? null,
          toAddress: row.core.toAddress ?? null,
          toPort: row.core.toPort ?? null,
          appName: row.core.appName ?? null,
          logMode: row.core.logMode,
          ruleComment: row.core.ruleComment ?? null,
          ipv6: row.core.ipv6,
          group: row.ui.group ?? null,
          name: row.ui.name ?? null,
          notes: row.ui.notes ?? null,
          originState: row.originState,
          isDeleted: row.isDeleted ?? false,
        })),
      },
    },
    include: { rules: { orderBy: { sortOrder: "asc" } } },
  });

  return session;
}

export async function updateDraftRules(
  serverId: string,
  userId: string,
  rows: RuleDraftInput[],
) {
  const session = await getOrCreateDraftSession(serverId, userId);
  const snapshot = await getLatestSnapshot(serverId);
  const remoteFingerprints = new Set(
    snapshot?.rules.map((rule) => rule.fingerprint) ?? [],
  );
  const localRecords = await db.ruleRecord.findMany({
    where: { serverId },
    select: { fingerprint: true },
  });
  const localFingerprints = new Set(localRecords.map((rule) => rule.fingerprint));

  await db.$transaction([
    db.draftRule.deleteMany({ where: { draftSessionId: session.id } }),
    db.draftRule.createMany({
      data: rows.map((row, index) => {
        const fingerprint = row.fingerprint || computeFingerprint(row.core);
        const originState = resolveDraftOriginState(
          row,
          remoteFingerprints,
          localFingerprints,
        );

        return {
          draftSessionId: session.id,
          clientRowId: row.clientRowId,
          fingerprint,
          sortOrder: row.sortOrder ?? index,
          action: row.core.action,
          direction: row.core.direction ?? null,
          interface: row.core.interface ?? null,
          protocol: row.core.protocol ?? null,
          fromAddress: row.core.fromAddress ?? null,
          fromPort: row.core.fromPort ?? null,
          toAddress: row.core.toAddress ?? null,
          toPort: row.core.toPort ?? null,
          appName: row.core.appName ?? null,
          logMode: row.core.logMode,
          ruleComment: row.core.ruleComment ?? null,
          ipv6: row.core.ipv6,
          group: row.ui.group ?? null,
          name: row.ui.name ?? null,
          notes: row.ui.notes ?? null,
          originState,
          isDeleted: row.isDeleted ?? false,
        };
      }),
    }),
    db.draftSession.update({
      where: { id: session.id },
      data: { savedAt: new Date() },
    }),
  ]);

  await syncRuleRecordMetadataFromDraft(
    serverId,
    rows.map((row) => ({
      fingerprint: row.fingerprint || computeFingerprint(row.core),
      isDeleted: row.isDeleted,
      ui: row.ui,
    })),
  );

  await createAuditEvent({
    userId,
    action: "DRAFT_SAVED",
    entityType: "server",
    entityId: serverId,
    metadata: { rulesCount: rows.length },
  });

  return getOrCreateDraftSession(serverId, userId);
}

export async function syncDraftOriginStates(serverId: string, userId: string): Promise<void> {
  const session = await getOrCreateDraftSession(serverId, userId);
  const snapshot = await getLatestSnapshot(serverId);
  const remoteFingerprints = new Set(
    snapshot?.rules.map((rule) => rule.fingerprint) ?? [],
  );
  const localRecords = await db.ruleRecord.findMany({
    where: { serverId },
    select: { fingerprint: true },
  });
  const localFingerprints = new Set(localRecords.map((rule) => rule.fingerprint));

  await Promise.all(
    session.rules.map((rule) => {
      const originState = resolveRuleOriginState(
        rule.fingerprint,
        remoteFingerprints,
        localFingerprints,
      );

      if (originState === rule.originState) {
        return Promise.resolve();
      }

      return db.draftRule.update({
        where: { id: rule.id },
        data: { originState },
      });
    }),
  );
}

export async function getTagValues(serverId: string, userId: string, kind: TagKind) {
  const session = await db.draftSession.findFirst({
    where: { serverId, userId, isActive: true },
    include: { rules: { where: { isDeleted: false } } },
  });

  if (session) {
    await syncRuleRecordMetadataFromDraft(
      serverId,
      session.rules.map((rule) => ({
        fingerprint: rule.fingerprint,
        isDeleted: rule.isDeleted,
        ui: { group: rule.group, name: rule.name, notes: rule.notes },
      })),
    );
  }

  const records = await db.ruleRecord.findMany({
    where: { serverId },
    select: { group: true, name: true },
  });

  const values = [
    ...new Set(
      records
        .map((record) => (kind === "GROUP" ? record.group : record.name))
        .filter((value): value is string => Boolean(value?.trim())),
    ),
  ].sort((a, b) => a.localeCompare(b));

  return values.map((value) => ({ value }));
}

async function syncRuleRecordMetadataFromDraft(
  serverId: string,
  rows: Array<{
    fingerprint: string;
    isDeleted?: boolean;
    ui: { group?: string | null; name?: string | null; notes?: string | null };
  }>,
) {
  const localRecords = await db.ruleRecord.findMany({
    where: { serverId },
    select: { fingerprint: true },
  });

  if (localRecords.length === 0) {
    return;
  }

  const localFingerprints = new Set(localRecords.map((record) => record.fingerprint));

  await Promise.all(
    rows
      .filter((row) => !row.isDeleted)
      .map((row) => {
        if (!localFingerprints.has(row.fingerprint)) {
          return Promise.resolve();
        }

        return db.ruleRecord.updateMany({
          where: { serverId, fingerprint: row.fingerprint },
          data: {
            group: row.ui.group?.trim() ? row.ui.group.trim() : null,
            name: row.ui.name?.trim() ? row.ui.name.trim() : null,
            notes: row.ui.notes?.trim() ? row.ui.notes.trim() : null,
          },
        });
      }),
  );
}

export async function getDraftRules(serverId: string, userId: string) {
  const session = await getOrCreateDraftSession(serverId, userId);
  return session.rules;
}
