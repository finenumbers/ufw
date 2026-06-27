"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import {
  getDockerControlRateLimitWindowMs,
  getDockerRefreshRateLimitWindowMs,
  isDockerMonitorEnabled,
} from "@/lib/docker/config";
import { assertValidContainerRef } from "@/lib/docker/container-ref";
import { assertRateLimit } from "@/lib/rate-limit";
import { getServerPath } from "@/lib/server-path";
import type { DockerContainerAction } from "@/types/docker-monitor";
import {
  controlDockerContainer,
  getDockerContainerInspect,
  getDockerInventoryById,
  getLatestDockerInventory,
  startDockerInventoryRefresh,
} from "@/server/services/docker-monitor.service";
import { getServerById } from "@/server/services/server.service";

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
  | { success: false; error: string }
> {
  if (!isDockerMonitorEnabled()) {
    return { success: false, error: "Docker monitoring is disabled on this installation." };
  }

  const userId = await requireUserId();
  const rateLimit = assertRateLimit(`docker-refresh:${serverId}`, {
    limit: 1,
    windowMs: getDockerRefreshRateLimitWindowMs(),
  });

  if (!rateLimit.allowed) {
    return {
      success: false,
      error: "Docker inventory was refreshed recently for this server. Please wait before refreshing again.",
    };
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

export async function getLatestDockerInventoryAction(serverId: string) {
  await requireUserId();
  return getLatestDockerInventory(serverId);
}

export async function getDockerInventoryByIdAction(snapshotId: string) {
  await requireUserId();
  return getDockerInventoryById(snapshotId);
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
  | { success: false; error: string }
> {
  if (!isDockerMonitorEnabled()) {
    return { success: false, error: "Docker monitoring is disabled on this installation." };
  }

  const userId = await requireUserId();
  const rateLimit = assertRateLimit(`docker-control:${serverId}`, {
    limit: 10,
    windowMs: getDockerControlRateLimitWindowMs(),
  });

  if (!rateLimit.allowed) {
    return {
      success: false,
      error: "Too many Docker control actions for this server. Please wait and try again.",
    };
  }

  try {
    assertValidContainerRef(containerRef);
    const { followUpSnapshotId } = await controlDockerContainer({
      serverId,
      userId,
      containerRef,
      containerName,
      action,
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
