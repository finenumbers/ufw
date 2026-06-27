import { db } from "@/lib/db";
import { computeFingerprint } from "@/lib/ufw/fingerprint";
import type { RuleCore } from "@/types/rule";
import type { ParsedRemoteRule, UfwDetectionResult } from "@/types/ufw";
import { createAuditEvent } from "@/server/services/audit.service";
import { detectUfwState } from "@/server/services/ssh.service";

function mapCoreFields(core: RuleCore) {
  return {
    action: core.action,
    direction: core.direction ?? null,
    interface: core.interface ?? null,
    protocol: core.protocol ?? null,
    fromAddress: core.fromAddress ?? null,
    fromPort: core.fromPort ?? null,
    toAddress: core.toAddress ?? null,
    toPort: core.toPort ?? null,
    appName: core.appName ?? null,
    logMode: core.logMode,
    ruleComment: core.ruleComment ?? null,
    ipv6: core.ipv6,
  };
}

function dedupeDetectionRules(rules: ParsedRemoteRule[]): ParsedRemoteRule[] {
  const seenFingerprints = new Set<string>();
  return rules.filter((rule) => {
    if (seenFingerprints.has(rule.fingerprint)) {
      return false;
    }
    seenFingerprints.add(rule.fingerprint);
    return true;
  });
}

const SNAPSHOT_RETENTION_COUNT = 10;

async function pruneOldSnapshots(serverId: string): Promise<void> {
  const staleSnapshots = await db.serverSnapshot.findMany({
    where: { serverId },
    orderBy: { capturedAt: "desc" },
    select: { id: true },
    skip: SNAPSHOT_RETENTION_COUNT,
  });

  if (staleSnapshots.length === 0) {
    return;
  }

  await db.serverSnapshot.deleteMany({
    where: { id: { in: staleSnapshots.map((snapshot) => snapshot.id) } },
  });
}

export async function persistSnapshotFromDetection(
  serverId: string,
  userId: string,
  detection: UfwDetectionResult,
): Promise<{ snapshotId: string; rulesCount: number }> {
  const uniqueRules = dedupeDetectionRules(detection.rules);

  const snapshot = await db.serverSnapshot.create({
    data: {
      serverId,
      ufwInstalled: detection.installed,
      ufwActive: detection.active,
      rawStatus: detection.status.rawStatus,
      interfaceOptions: detection.interfaces,
      rules: {
        create: uniqueRules.map((rule, index) => ({
          fingerprint: rule.fingerprint,
          sortOrder: index,
          ...mapCoreFields(rule.core),
          rawLine: rule.rawLine,
        })),
      },
    },
  });

  await createAuditEvent({
    userId,
    action: "SNAPSHOT_LOADED",
    entityType: "server",
    entityId: serverId,
    metadata: { snapshotId: snapshot.id, rulesCount: detection.rules.length },
  });

  await pruneOldSnapshots(serverId);

  return { snapshotId: snapshot.id, rulesCount: detection.rules.length };
}

export async function captureSnapshot(
  serverId: string,
  userId: string,
  options?: import("@/lib/queue/queue-registry").RunForServerOptions,
): Promise<{ snapshotId: string; rulesCount: number }> {
  const detection = await detectUfwState(serverId, options);
  return persistSnapshotFromDetection(serverId, userId, detection);
}

export async function getLatestSnapshot(serverId: string) {
  return db.serverSnapshot.findFirst({
    where: { serverId },
    orderBy: { capturedAt: "desc" },
    include: { rules: { orderBy: { sortOrder: "asc" } } },
  });
}

export function detectionFromSnapshot(
  snapshot: NonNullable<Awaited<ReturnType<typeof getLatestSnapshot>>>,
): UfwDetectionResult {
  return {
    installed: snapshot.ufwInstalled,
    active: snapshot.ufwActive,
    status: {
      installed: snapshot.ufwInstalled,
      active: snapshot.ufwActive,
      rawStatus: snapshot.rawStatus ?? "",
    },
    rules: snapshot.rules.map((rule) => ({
      fingerprint: rule.fingerprint,
      rawLine: rule.rawLine ?? "",
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
    })),
    interfaces: snapshot.interfaceOptions,
  };
}

export async function getSnapshotInterfaceOptions(serverId: string): Promise<string[]> {
  const snapshot = await getLatestSnapshot(serverId);
  return snapshot?.interfaceOptions ?? [];
}

export async function persistSnapshotInterfaceOptions(
  serverId: string,
  interfaceOptions: string[],
  snapshot?: Awaited<ReturnType<typeof getLatestSnapshot>>,
): Promise<void> {
  const target = snapshot ?? (await getLatestSnapshot(serverId));
  if (!target) return;

  await db.serverSnapshot.update({
    where: { id: target.id },
    data: { interfaceOptions },
  });
}

export async function syncRuleRecordsFromDraft(
  serverId: string,
  rows: Array<{
    fingerprint: string;
    sortOrder: number;
    core: RuleCore;
    ui: { group?: string | null; name?: string | null; notes?: string | null };
  }>,
) {
  await db.$transaction([
    db.ruleRecord.deleteMany({ where: { serverId } }),
    db.ruleRecord.createMany({
      data: rows.map((row) => ({
        serverId,
        fingerprint: row.fingerprint || computeFingerprint(row.core),
        sortOrder: row.sortOrder,
        ...mapCoreFields(row.core),
        group: row.ui.group ?? null,
        name: row.ui.name ?? null,
        notes: row.ui.notes ?? null,
      })),
    }),
  ]);
}
