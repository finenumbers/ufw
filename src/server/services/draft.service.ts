import { db } from "@/lib/db";
import { computeFingerprint } from "@/lib/ufw/fingerprint";
import { resolveRuleOriginState } from "@/lib/ufw/origin-state";
import { generateId } from "@/lib/utils";
import type { RuleDraftInput } from "@/types/rule";
import { createAuditEvent } from "@/server/services/audit.service";
import { getLatestSnapshot, syncRuleRecordsFromDraft } from "@/server/services/snapshot.service";

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

export async function seedDraftFromUnifiedRules(
  serverId: string,
  userId: string,
  rows: RuleDraftInput[],
  options?: { savedAt?: Date | null },
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
      savedAt: options?.savedAt !== undefined ? options.savedAt : null,
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

export async function replaceDraftSessionRules(
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
          clientRowId: row.clientRowId || generateId(),
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
      data: { savedAt: null },
    }),
  ]);

  return getOrCreateDraftSession(serverId, userId);
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

  await syncRuleRecordsFromDraft(
    serverId,
    rows
      .filter((row) => !row.isDeleted)
      .map((row, index) => ({
        fingerprint: row.fingerprint || computeFingerprint(row.core),
        sortOrder: row.sortOrder ?? index,
        core: row.core,
        ui: row.ui,
      })),
  );

  await syncDraftOriginStates(serverId, userId);

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

  const updates = session.rules
    .map((rule) => {
      const originState = resolveRuleOriginState(
        rule.fingerprint,
        remoteFingerprints,
        localFingerprints,
      );

      if (originState === rule.originState) {
        return null;
      }

      return { id: rule.id, originState };
    })
    .filter((entry): entry is { id: string; originState: typeof session.rules[number]["originState"] } =>
      entry !== null,
    );

  if (updates.length === 0) {
    return;
  }

  await db.$transaction(
    updates.map((update) =>
      db.draftRule.update({
        where: { id: update.id },
        data: { originState: update.originState },
      }),
    ),
  );
}

export async function getDistinctRuleFieldValues(
  serverId: string,
  userId: string,
  kind: "GROUP" | "NAME",
) {
  const session = await db.draftSession.findFirst({
    where: { serverId, userId, isActive: true },
    include: { rules: { where: { isDeleted: false } } },
  });

  const values = new Set<string>();

  if (session) {
    for (const rule of session.rules) {
      const raw = kind === "GROUP" ? rule.group : rule.name;
      if (raw?.trim()) {
        values.add(raw.trim());
      }
    }
  }

  const records = await db.ruleRecord.findMany({
    where: { serverId },
    select: { group: true, name: true },
  });

  for (const record of records) {
    const raw = kind === "GROUP" ? record.group : record.name;
    if (raw?.trim()) {
      values.add(raw.trim());
    }
  }

  return [...values]
    .sort((a, b) => a.localeCompare(b))
    .map((value) => ({ value }));
}

export async function getDraftRules(serverId: string, userId: string) {
  const session = await getOrCreateDraftSession(serverId, userId);
  return session.rules;
}
