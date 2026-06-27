"use server";

import { revalidatePath } from "next/cache";

import { z } from "zod";

import { requireUserId, requireUserIdForAction } from "@/lib/auth/require-user";
import { isDockerMonitorEnabled } from "@/lib/docker/config";
import { assertValidContainerRef } from "@/lib/docker/container-ref";
import { checkOperationRateLimit, createRateLimitedFailure } from "@/lib/operation-rate-limit";
import { getServerPath } from "@/lib/server-path";
import type { ActionFailureResult } from "@/types/action-result";
import type { DockerContainerAction } from "@/types/docker-monitor";
import {
  controlDockerContainer,
  getDockerContainerInspect,
  getDockerInventoryById,
  getDockerInventoryStatusById,
  getLatestDockerInventory,
  startDockerInventoryRefresh,
} from "@/server/services/docker-monitor.service";
import { getServerById } from "@/server/services/server.service";

const dockerContainerActionSchema = z.enum(["START", "STOP", "RESTART"]);

export async function refreshDockerInventoryAction(
  serverId: string,
): Promise<
  | { success: true; snapshotId: string; operationId: string }
  | ActionFailureResult
> {
  if (!isDockerMonitorEnabled()) {
    return { success: false, error: "Docker monitoring is disabled on this installation." };
  }

  const auth = await requireUserIdForAction();
  if (!auth.ok) {
    return auth.failure;
  }

  const rateLimit = checkOperationRateLimit(`docker-refresh:${serverId}`);

  if (!rateLimit.allowed) {
    return createRateLimitedFailure(rateLimit.retryAfterMs);
  }

  try {
    const result = await startDockerInventoryRefresh({ serverId, userId: auth.userId });
    const server = await getServerById(serverId);
    if (server) {
      revalidatePath(getServerPath(server.host));
    }
    return { success: true, ...result };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Docker inventory refresh failed";
    return { success: false, error: message };
  }
}

/** Single round-trip poll: lightweight status while running, full inventory when finished. */
export async function pollDockerInventoryAction(snapshotId: string) {
  await requireUserId();
  const status = await getDockerInventoryStatusById(snapshotId);
  if (!status) {
    return null;
  }
  if (status.status === "SUCCESS" || status.status === "FAILED") {
    return getDockerInventoryById(snapshotId);
  }
  return status;
}

export async function getDockerContainerInspectAction(serverId: string, containerRef: string) {
  await requireUserId();
  if (!isDockerMonitorEnabled()) {
    return null;
  }

  try {
    assertValidContainerRef(containerRef);
    return getDockerContainerInspect(serverId, containerRef);
  } catch {
    return null;
  }
}

export async function controlDockerContainerAction(
  serverId: string,
  containerRef: string,
  containerName: string,
  action: DockerContainerAction,
): Promise<
  | { success: true; followUpSnapshotId: string }
  | ActionFailureResult
> {
  if (!isDockerMonitorEnabled()) {
    return { success: false, error: "Docker monitoring is disabled on this installation." };
  }

  const auth = await requireUserIdForAction();
  if (!auth.ok) {
    return auth.failure;
  }

  const parsedAction = dockerContainerActionSchema.safeParse(action);
  if (!parsedAction.success) {
    return { success: false, error: "Invalid container action" };
  }

  const rateLimit = checkOperationRateLimit(`docker-control:${serverId}`);

  if (!rateLimit.allowed) {
    return createRateLimitedFailure(rateLimit.retryAfterMs);
  }

  try {
    assertValidContainerRef(containerRef);
    const { followUpSnapshotId } = await controlDockerContainer({
      serverId,
      userId: auth.userId,
      containerRef,
      containerName,
      action: parsedAction.data,
    });

    const server = await getServerById(serverId);
    if (server) {
      revalidatePath(getServerPath(server.host));
    }

    return { success: true, followUpSnapshotId };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Docker control failed";
    return { success: false, error: message };
  }
}

export async function getLatestDockerInventoryForServerAction(serverId: string) {
  await requireUserId();
  return getLatestDockerInventory(serverId);
}
