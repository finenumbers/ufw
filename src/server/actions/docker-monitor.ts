"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { z } from "zod";

import { auth } from "@/lib/auth";
import {
  isDockerMonitorEnabled,
} from "@/lib/docker/config";
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
  startDockerInventoryRefresh,
} from "@/server/services/docker-monitor.service";
import { getServerById } from "@/server/services/server.service";

const dockerContainerActionSchema = z.enum(["START", "STOP", "RESTART"]);

async function requireUserId(): Promise<string> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session.user.id;
}

export async function refreshDockerInventoryAction(
  serverId: string,
): Promise<
  | { success: true; snapshotId: string; operationId: string }
  | ActionFailureResult
> {
  if (!isDockerMonitorEnabled()) {
    return { success: false, error: "Docker monitoring is disabled on this installation." };
  }

  const userId = await requireUserId();
  const rateLimit = checkOperationRateLimit(`docker-refresh:${serverId}`);

  if (!rateLimit.allowed) {
    return createRateLimitedFailure(rateLimit.retryAfterMs);
  }

  try {
    const result = await startDockerInventoryRefresh({ serverId, userId });
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

export async function getDockerInventoryByIdAction(snapshotId: string) {
  await requireUserId();
  return getDockerInventoryById(snapshotId);
}

export async function getDockerInventoryStatusByIdAction(snapshotId: string) {
  await requireUserId();
  return getDockerInventoryStatusById(snapshotId);
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

  const userId = await requireUserId();
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
      userId,
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
