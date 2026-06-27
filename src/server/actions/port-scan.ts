"use server";

import { revalidatePath } from "next/cache";

import { requireUserId, requireUserIdForAction } from "@/lib/auth/require-user";
import { checkOperationRateLimit, createRateLimitedFailure } from "@/lib/operation-rate-limit";
import { isPortScanEnabled } from "@/lib/port-scan/config";
import { getServerPath } from "@/lib/server-path";
import type { ActionFailureResult } from "@/types/action-result";
import {
  getPortScanById,
  getPortScanStatusById,
  getLatestSuccessfulPortScan,
  startPortScan,
} from "@/server/services/port-scan.service";
import { getServerById } from "@/server/services/server.service";

export async function startPortScanAction(
  serverId: string,
): Promise<
  | { success: true; scanId: string; operationId: string }
  | ActionFailureResult
> {
  if (!isPortScanEnabled()) {
    return { success: false, error: "Port scanning is disabled on this installation." };
  }

  const auth = await requireUserIdForAction();
  if (!auth.ok) {
    return auth.failure;
  }

  const rateLimit = checkOperationRateLimit(`port-scan:${serverId}`);

  if (!rateLimit.allowed) {
    return createRateLimitedFailure(rateLimit.retryAfterMs);
  }

  try {
    const result = await startPortScan({ serverId, userId: auth.userId });
    const server = await getServerById(serverId);
    if (server) {
      revalidatePath(getServerPath(server.host));
    }
    return { success: true, ...result };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Port scan failed to start";
    return { success: false, error: message };
  }
}

export async function getPortScanByIdAction(scanId: string) {
  await requireUserId();
  return getPortScanById(scanId);
}

export async function getPortScanStatusByIdAction(scanId: string) {
  await requireUserId();
  return getPortScanStatusById(scanId);
}

export async function getLatestPortScanForServerAction(serverId: string) {
  await requireUserId();
  return getLatestSuccessfulPortScan(serverId);
}
