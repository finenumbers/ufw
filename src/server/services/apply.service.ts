import type { Prisma } from "@prisma/client";

import type { UnifiedRuleRow } from "@/types/rule";
import type { ApplyPreviewResult } from "@/types/apply";
import type { UfwDetectionResult } from "@/types/ufw";
import { db } from "@/lib/db";
import { diffDesiredVsRemote } from "@/lib/ufw/diff";
import {
  buildApplyPlan,
  hasApplyChanges,
  rebuildApplyPlanAtConfirm,
} from "@/lib/ufw/plan";
import { validateRulesForUfwApply } from "@/lib/ufw/commands";
import { executeApplyPlan, loadUfwStatusAndRules } from "@/lib/ufw/apply";
import { collectInterfaceOptions, loadNetworkInterfaces } from "@/lib/ssh/interfaces";
import { createAuditEvent } from "@/server/services/audit.service";
import {
  commandStep,
  semanticStep,
  startOperation,
  type OperationTracker,
} from "@/server/services/operation-progress.service";
import {
  getLatestSnapshot,
  persistSnapshotFromDetection,
  syncRuleRecordsFromDraft,
} from "@/server/services/snapshot.service";
import {
  buildPostApplyRuleRecords,
  resolveApplyClaimError,
} from "@/server/services/apply-sync";
import { getLiveRemoteParsedRules } from "@/server/services/rules-view.service";
import { runSshForServer } from "@/server/services/ssh.service";
import { syncDraftOriginStates, updateDraftRules } from "@/server/services/draft.service";
import type { ApplyPlan } from "@/types/apply";

function validatePlanCommands(plan: ApplyPlan): void {
  for (const item of plan.items) {
    if (!item.remoteCommand) {
      throw new Error(
        `Cannot apply ${item.action} for rule ${item.fingerprint}: missing UFW command`,
      );
    }
  }
}

function parseDesiredRows(value: Prisma.JsonValue | null): UnifiedRuleRow[] {
  if (!value || !Array.isArray(value)) {
    return [];
  }

  return value as UnifiedRuleRow[];
}

function findSessionItemForPlanItem(
  sessionItems: Array<{ id: string; fingerprint: string; sortOrder: number }>,
  planItem: ApplyPlan["items"][number],
  index: number,
) {
  return (
    sessionItems.find(
      (item) =>
        item.fingerprint === planItem.fingerprint && item.sortOrder === planItem.sortOrder,
    ) ?? sessionItems[index]
  );
}

async function buildDetectionFromClient(
  client: import("@/lib/ssh/client").SshClient,
  password?: string,
): Promise<UfwDetectionResult> {
  const loaded = await loadUfwStatusAndRules(client, password);
  const installed = loaded.rawStatus.includes("Status:");
  const rules = installed ? loaded.rules : [];
  const networkInterfaces = await loadNetworkInterfaces(client);
  const interfaces = collectInterfaceOptions(networkInterfaces, rules);

  return {
    installed,
    active: loaded.active,
    status: {
      installed,
      active: loaded.active,
      rawStatus: loaded.rawStatus,
    },
    rules,
    interfaces,
  };
}

export async function previewApply(
  serverId: string,
  userId: string,
  desired: UnifiedRuleRow[],
): Promise<ApplyPreviewResult> {
  const validationError = validateRulesForUfwApply(desired);
  if (validationError) {
    throw new Error(validationError);
  }

  const remote = await getLiveRemoteParsedRules(serverId);
  const diff = diffDesiredVsRemote(desired, remote);
  const plan = buildApplyPlan(diff, desired, remote);

  if (!hasApplyChanges(plan)) {
    throw new Error("No changes to apply");
  }

  validatePlanCommands(plan);

  const session = await db.applySession.create({
    data: {
      serverId,
      userId,
      status: "PENDING",
      summary: plan.summary,
      desiredJson: desired as unknown as Prisma.InputJsonValue,
      items: {
        create: plan.items.map((item) => ({
          action: item.action,
          fingerprint: item.fingerprint,
          beforeJson: item.before ?? undefined,
          afterJson: item.after ?? undefined,
          remoteCommand: item.remoteCommand,
          sortOrder: item.sortOrder,
          status: "PENDING",
        })),
      },
    },
  });

  await createAuditEvent({
    userId,
    action: "APPLY_PREVIEWED",
    entityType: "server",
    entityId: serverId,
    metadata: { sessionId: session.id, summary: plan.summary },
  });

  return { sessionId: session.id, plan };
}

async function runPostApplySync(
  session: { serverId: string; userId: string; desiredJson: Prisma.JsonValue | null },
  tracker: OperationTracker,
  options?: { detection?: UfwDetectionResult },
): Promise<void> {
  await tracker.setPhase("snapshot", { key: "phases.snapshot" });
  await tracker.startStep("snapshot", semanticStep("snapshot", "steps.snapshot"));
  if (options?.detection) {
    await persistSnapshotFromDetection(session.serverId, session.userId, options.detection);
  } else {
    const { captureSnapshot } = await import("@/server/services/snapshot.service");
    await captureSnapshot(session.serverId, session.userId);
  }
  await tracker.completeStep("snapshot");

  await tracker.setPhase("sync_db", { key: "phases.sync_db" });
  await tracker.startStep("sync_db", semanticStep("sync_db", "steps.sync_db"));

  const snapshot = await getLatestSnapshot(session.serverId);
  if (!snapshot) {
    throw new Error("Snapshot missing after apply");
  }

  const desiredRows = parseDesiredRows(session.desiredJson);

  await syncRuleRecordsFromDraft(
    session.serverId,
    buildPostApplyRuleRecords(snapshot.rules, desiredRows),
  );
  await tracker.completeStep("sync_db");

  await tracker.setPhase("origin_states", { key: "phases.origin_states" });
  await tracker.startStep("origin_states", semanticStep("origin_states", "steps.origin_states"));
  await syncDraftOriginStates(session.serverId, session.userId);
  await tracker.completeStep("origin_states");
}

export async function confirmApply(
  sessionId: string,
  userId: string,
): Promise<{ success: boolean; error?: string; partial?: boolean; needsResync?: boolean }> {
  const session = await db.applySession.findUnique({
    where: { id: sessionId },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });

  if (!session || session.userId !== userId) {
    return { success: false, error: "Apply session not found" };
  }

  const claim = await db.applySession.updateMany({
    where: { id: sessionId, userId, status: "PENDING" },
    data: { status: "RUNNING", confirmedAt: new Date() },
  });

  const claimError = resolveApplyClaimError(claim.count);
  if (claimError) {
    return { success: false, error: claimError };
  }

  const desiredRows = parseDesiredRows(session.desiredJson);

  await createAuditEvent({
    userId,
    action: "APPLY_CONFIRMED",
    entityType: "apply_session",
    entityId: sessionId,
  });

  const summary = session.summary as ApplyPreviewResult["plan"]["summary"];
  const estimatedSteps = session.items.length + 3;
  const tracker = await startOperation({
    serverId: session.serverId,
    userId,
    type: "apply.rules",
    messageI18n: { key: "messages.apply_prepare" },
    metadata: {
      phase: "ufw_commands",
      phaseI18n: { key: "phases.ufw_commands" },
      current: 0,
      total: estimatedSteps,
      summary,
    },
    steps: [
      ...session.items.map((item) =>
        commandStep(item.id, item.remoteCommand ?? `${item.action} (${item.fingerprint})`),
      ),
      semanticStep("snapshot", "steps.snapshot"),
      semanticStep("sync_db", "steps.sync_db"),
      semanticStep("origin_states", "steps.origin_states"),
    ],
  });

  try {
    const sshResult = await runSshForServer(
      session.serverId,
      async (client, config) => {
        const initialDetection = await buildDetectionFromClient(client, config.password);
        const plan = rebuildApplyPlanAtConfirm(desiredRows, initialDetection.rules);
        validatePlanCommands(plan);

        if (!hasApplyChanges(plan)) {
          throw new Error("No changes to apply");
        }

        const totalSteps = plan.items.length + 3;
        await tracker.setProgress(0, totalSteps, {
          key: "messages.apply_progress",
          params: { current: 0, total: plan.items.length, command: "prepare" },
        });

        const execResult = await executeApplyPlan(client, plan, config.password, {
          onProgress: async (event) => {
            const planItem = plan.items[event.index];
            if (!planItem) return;

            const sessionItem = findSessionItemForPlanItem(session.items, planItem, event.index);
            const command = event.item.remoteCommand ?? event.item.action;

            if (event.status === "RUNNING") {
              if (sessionItem) {
                await db.applySessionItem.update({
                  where: { id: sessionItem.id },
                  data: { status: "RUNNING" },
                });
                await tracker.startStep(
                  sessionItem.id,
                  commandStep(sessionItem.id, command),
                );
              }
              await tracker.setProgress(event.index + 1, totalSteps, {
                key: "messages.apply_progress",
                params: {
                  current: event.index + 1,
                  total: event.total,
                  command,
                },
              });
              return;
            }

            if (!sessionItem) {
              return;
            }

            if (event.status === "SUCCESS") {
              await db.applySessionItem.update({
                where: { id: sessionItem.id },
                data: { status: "SUCCESS" },
              });
              await tracker.completeStep(sessionItem.id);
              return;
            }

            await db.applySessionItem.update({
              where: { id: sessionItem.id },
              data: {
                status: "FAILED",
                errorMessage: event.error,
              },
            });
            await tracker.failStep(sessionItem.id, event.error ?? "Command failed");
          },
        });

        if (!execResult.success) {
          return { execResult, detection: null };
        }

        const detection = await buildDetectionFromClient(client, config.password);
        return { execResult, detection };
      },
      { onStart: async () => tracker.markRunning() },
    );

    if (!sshResult.execResult.success) {
      const sessionStatus = sshResult.execResult.partial ? "PARTIAL" : "FAILED";

      await db.applySession.update({
        where: { id: sessionId },
        data: {
          status: sessionStatus,
          errorMessage: sshResult.execResult.errors.join("; "),
          completedAt: new Date(),
        },
      });

      await createAuditEvent({
        userId,
        action: "APPLY_FAILED",
        entityType: "apply_session",
        entityId: sessionId,
        metadata: {
          errors: sshResult.execResult.errors,
          partial: sshResult.execResult.partial ?? false,
        },
      });

      await tracker.fail(
        {
          key: "messages.apply_failed",
          params: { error: sshResult.execResult.errors[0] ?? "unknown error" },
        },
        sshResult.execResult.errors,
      );

      return {
        success: false,
        error: sshResult.execResult.errors.join("; "),
        partial: sshResult.execResult.partial,
        needsResync: Boolean(sshResult.execResult.partial),
      };
    }

    if (!sshResult.detection) {
      throw new Error("Post-apply snapshot data missing");
    }

    if (desiredRows.length > 0) {
      await updateDraftRules(session.serverId, userId, desiredRows);
    }

    await runPostApplySync(session, tracker, { detection: sshResult.detection });

    await db.applySession.update({
      where: { id: sessionId },
      data: { status: "SUCCESS", completedAt: new Date() },
    });

    await createAuditEvent({
      userId,
      action: "APPLY_COMPLETED",
      entityType: "apply_session",
      entityId: sessionId,
    });

    await tracker.complete({ key: "messages.apply_complete" }, summary);

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Apply failed";
    await db.applySession.update({
      where: { id: sessionId },
      data: { status: "FAILED", errorMessage: message, completedAt: new Date() },
    });
    await tracker.fail({ key: "messages.apply_failed", params: { error: message } }, [message]);
    return { success: false, error: message };
  }
}

export async function getApplySession(sessionId: string) {
  return db.applySession.findUnique({
    where: { id: sessionId },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });
}