import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { getDockerInventoryHistoryLimit } from "@/lib/docker/config";
import { runDockerContainerControl } from "@/lib/docker/control";
import { parseDockerInspectOutput } from "@/lib/docker/inspect-parser";
import { collectDockerInventory, fetchDockerInspect } from "@/lib/docker/inventory";
import { summarizeInventory } from "@/lib/docker/normalize";
import type {
  DockerContainerAction,
  DockerContainerView,
  DockerInspectView,
  DockerInventorySummary,
  DockerInventoryView,
} from "@/types/docker-monitor";
import { createAuditEvent } from "@/server/services/audit.service";
import {
  semanticStep,
  startOperation,
  type OperationTracker,
} from "@/server/services/operation-progress.service";
import { runSshForServer } from "@/server/services/ssh.service";

function bigintToString(value: bigint | null | undefined): string | null {
  return value == null ? null : value.toString();
}

function toContainerView(row: {
  id: string;
  containerId: string;
  name: string;
  image: string;
  status: string;
  health: string | null;
  stateExitCode: number | null;
  restartCount: number | null;
  publishedPorts: Prisma.JsonValue | null;
  composeProject: string | null;
  composeService: string | null;
  cpuPercent: number | null;
  memUsageBytes: bigint | null;
  memLimitBytes: bigint | null;
  startedAt: Date | null;
  createdAtRemote: Date | null;
}): DockerContainerView {
  const publishedPorts = Array.isArray(row.publishedPorts)
    ? (row.publishedPorts as DockerContainerView["publishedPorts"])
    : [];

  return {
    id: row.id,
    containerId: row.containerId,
    name: row.name,
    image: row.image,
    status: row.status,
    health: row.health,
    stateExitCode: row.stateExitCode,
    restartCount: row.restartCount,
    publishedPorts,
    composeProject: row.composeProject,
    composeService: row.composeService,
    cpuPercent: row.cpuPercent,
    memUsageBytes: bigintToString(row.memUsageBytes),
    memLimitBytes: bigintToString(row.memLimitBytes),
    memUsageLabel: null,
    startedAt: row.startedAt?.toISOString() ?? null,
    createdAtRemote: row.createdAtRemote?.toISOString() ?? null,
  };
}

function toInventoryView(snapshot: {
  id: string;
  serverId: string;
  status: DockerInventoryView["status"];
  dockerInstalled: boolean;
  dockerReachable: boolean;
  dockerVersion: string | null;
  composeVersion: string | null;
  containerCount: number;
  runningCount: number;
  errorMessage: string | null;
  capturedAt: Date;
  containers: Array<Parameters<typeof toContainerView>[0]>;
}): DockerInventoryView {
  const summary: DockerInventorySummary = {
    containerCount: snapshot.containerCount,
    runningCount: snapshot.runningCount,
    stoppedCount: snapshot.containerCount - snapshot.runningCount,
  };

  return {
    id: snapshot.id,
    serverId: snapshot.serverId,
    status: snapshot.status,
    dockerInstalled: snapshot.dockerInstalled,
    dockerReachable: snapshot.dockerReachable,
    dockerVersion: snapshot.dockerVersion,
    composeVersion: snapshot.composeVersion,
    summary,
    errorMessage: snapshot.errorMessage,
    capturedAt: snapshot.capturedAt.toISOString(),
    containers: snapshot.containers.map(toContainerView),
  };
}

async function trimInventoryHistory(serverId: string): Promise<void> {
  const limit = getDockerInventoryHistoryLimit();
  const snapshots = await db.dockerInventorySnapshot.findMany({
    where: { serverId },
    orderBy: { capturedAt: "desc" },
    select: { id: true },
    skip: limit,
  });

  if (snapshots.length === 0) {
    return;
  }

  await db.dockerInventorySnapshot.deleteMany({
    where: { id: { in: snapshots.map((row) => row.id) } },
  });
}

export async function getLatestDockerInventory(
  serverId: string,
): Promise<DockerInventoryView | null> {
  const snapshot = await db.dockerInventorySnapshot.findFirst({
    where: { serverId, status: "SUCCESS" },
    orderBy: { capturedAt: "desc" },
    include: {
      containers: {
        orderBy: [{ composeProject: "asc" }, { name: "asc" }],
      },
    },
  });

  if (!snapshot) {
    const failed = await db.dockerInventorySnapshot.findFirst({
      where: { serverId },
      orderBy: { capturedAt: "desc" },
      include: { containers: true },
    });
    return failed ? toInventoryView(failed) : null;
  }

  return toInventoryView(snapshot);
}

export async function runDockerInventoryRefresh(
  snapshotId: string,
  tracker: OperationTracker,
): Promise<void> {
  const pending = await db.dockerInventorySnapshot.findUnique({
    where: { id: snapshotId },
  });

  if (!pending) {
    throw new Error("Docker inventory snapshot not found");
  }

  await runSshForServer(
    pending.serverId,
    async (client, config) => {
      await tracker.markRunning();
      await tracker.startStep("preflight", semanticStep("preflight", "steps.docker_preflight"));
      await tracker.setProgress(1, 4, { key: "messages.docker_preflight" });

      const collected = await collectDockerInventory(client, { sudoPassword: config.password });

      await tracker.completeStep("preflight");

      if (!collected.preflight.dockerReachable) {
        await db.dockerInventorySnapshot.update({
          where: { id: snapshotId },
          data: {
            status: "FAILED",
            dockerInstalled: collected.preflight.dockerInstalled,
            dockerReachable: false,
            errorMessage: collected.preflight.errorMessage,
          },
        });
        throw new Error(collected.preflight.errorMessage ?? "Docker is not available");
      }

      await tracker.startStep("list_containers", semanticStep("list_containers", "steps.docker_list"));
      await tracker.setProgress(2, 4, { key: "messages.docker_list" });
      await tracker.completeStep("list_containers");

      await tracker.startStep("collect_stats", semanticStep("collect_stats", "steps.docker_stats"));
      await tracker.setProgress(3, 4, { key: "messages.docker_stats" });
      await tracker.completeStep("collect_stats");

      await tracker.startStep("persist", semanticStep("persist", "steps.docker_persist"));
      await tracker.setProgress(4, 4, { key: "messages.docker_persist" });

      const summary = summarizeInventory(collected.containers);
      await db.dockerInventorySnapshot.update({
        where: { id: snapshotId },
        data: {
          status: "SUCCESS",
          dockerInstalled: collected.preflight.dockerInstalled,
          dockerReachable: true,
          dockerVersion: collected.preflight.dockerVersion,
          composeVersion: collected.preflight.composeVersion,
          containerCount: summary.containerCount,
          runningCount: summary.runningCount,
          errorMessage: null,
          containers: {
            deleteMany: {},
            create: collected.containers.map((row) => ({
              containerId: row.containerId,
              name: row.name,
              image: row.image,
              status: row.status,
              health: row.health,
              stateExitCode: row.stateExitCode,
              restartCount: row.restartCount,
              publishedPorts: row.publishedPorts as Prisma.InputJsonValue,
              composeProject: row.composeProject,
              composeService: row.composeService,
              cpuPercent: row.cpuPercent,
              memUsageBytes: row.memUsageBytes,
              memLimitBytes: row.memLimitBytes,
              startedAt: row.startedAt,
              createdAtRemote: row.createdAtRemote,
            })),
          },
        },
      });

      await trimInventoryHistory(pending.serverId);
      await tracker.completeStep("persist");
      await tracker.complete(
        {
          key: "messages.docker_inventory_complete",
          params: {
            total: String(summary.containerCount),
            running: String(summary.runningCount),
          },
        },
        summary,
      );

      await createAuditEvent({
        userId: pending.userId ?? undefined,
        action: "DOCKER_INVENTORY_REFRESHED",
        entityType: "server",
        entityId: pending.serverId,
        metadata: { snapshotId, ...summary },
      });
    },
    {
      onStart: async () => {
        await tracker.markRunning();
      },
    },
  ).catch(async (error) => {
    const message = error instanceof Error ? error.message : "Docker inventory refresh failed";

    await db.dockerInventorySnapshot.update({
      where: { id: snapshotId },
      data: {
        status: "FAILED",
        errorMessage: message,
      },
    });

    await tracker.fail(
      { key: "messages.docker_inventory_failed", params: { error: message } },
      [message],
    );
  });
}

export async function startDockerInventoryRefresh(params: {
  serverId: string;
  userId: string;
}): Promise<{ snapshotId: string; operationId: string }> {
  const tracker = await startOperation({
    serverId: params.serverId,
    userId: params.userId,
    type: "docker.inventory",
    messageI18n: { key: "messages.docker_inventory_start" },
    steps: [
      semanticStep("preflight", "steps.docker_preflight"),
      semanticStep("list_containers", "steps.docker_list"),
      semanticStep("collect_stats", "steps.docker_stats"),
      semanticStep("persist", "steps.docker_persist"),
    ],
  });

  const snapshot = await db.dockerInventorySnapshot.create({
    data: {
      serverId: params.serverId,
      userId: params.userId,
      operationLogId: tracker.operationId,
      status: "PENDING",
    },
  });

  void runDockerInventoryRefresh(snapshot.id, tracker).catch(() => {});

  return { snapshotId: snapshot.id, operationId: tracker.operationId };
}

export async function getDockerContainerInspect(
  serverId: string,
  containerRef: string,
): Promise<DockerInspectView | null> {
  const result = await runSshForServer(serverId, async (client, config) => {
    const response = await fetchDockerInspect(client, containerRef, {
      sudoPassword: config.password,
    });
    if (response.code !== 0) {
      throw new Error((response.stderr || response.stdout || "Inspect failed").trim());
    }
    return response.stdout;
  });

  return parseDockerInspectOutput(result);
}

const CONTROL_AUDIT: Record<DockerContainerAction, "DOCKER_CONTAINER_STARTED" | "DOCKER_CONTAINER_STOPPED" | "DOCKER_CONTAINER_RESTARTED"> = {
  START: "DOCKER_CONTAINER_STARTED",
  STOP: "DOCKER_CONTAINER_STOPPED",
  RESTART: "DOCKER_CONTAINER_RESTARTED",
};

export async function controlDockerContainer(params: {
  serverId: string;
  userId: string;
  containerRef: string;
  containerName: string;
  action: DockerContainerAction;
}): Promise<void> {
  const tracker = await startOperation({
    serverId: params.serverId,
    userId: params.userId,
    type: "docker.control",
    messageI18n: {
      key: "messages.docker_control_start",
      params: { action: params.action, name: params.containerName },
    },
    steps: [semanticStep("control", "steps.docker_control")],
  });

  try {
    await runSshForServer(params.serverId, async (client, config) => {
      await tracker.markRunning();
      await tracker.startStep("control", semanticStep("control", "steps.docker_control"));

      const result = await runDockerContainerControl(
        client,
        params.containerRef,
        params.action,
        { sudoPassword: config.password },
      );
      if (result.code !== 0) {
        throw new Error((result.stderr || result.stdout || "Docker control failed").trim());
      }

      await tracker.completeStep("control");
      await tracker.complete({
        key: "messages.docker_control_complete",
        params: { action: params.action, name: params.containerName },
      });
    });

    await createAuditEvent({
      userId: params.userId,
      action: CONTROL_AUDIT[params.action],
      entityType: "server",
      entityId: params.serverId,
      metadata: {
        containerRef: params.containerRef,
        containerName: params.containerName,
        action: params.action,
      },
    });

    void startDockerInventoryRefresh({
      serverId: params.serverId,
      userId: params.userId,
    }).catch(() => {});
  } catch (error) {
    const message = error instanceof Error ? error.message : "Docker control failed";
    await tracker.fail(
      { key: "messages.docker_control_failed", params: { error: message } },
      [message],
    );
    throw error;
  }
}
