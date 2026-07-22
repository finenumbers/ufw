"use server";

import { revalidatePath } from "next/cache";

import { getTranslations } from "next-intl/server";

import { requireUserId, requireUserIdForAction } from "@/lib/auth/require-user";
import { checkOperationRateLimit, createRateLimitedFailure } from "@/lib/operation-rate-limit";
import { isPortScanEnabled } from "@/lib/port-scan/config";
import { getServerPath } from "@/lib/server-path";
import type { ActionFailureResult } from "@/types/action-result";
import {
  getPortScanById,
  getPortScanStatusById,
  getLatestPortScan,
  PORT_SCAN_IN_PROGRESS,
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
    if (error instanceof Error && error.message === PORT_SCAN_IN_PROGRESS) {
      const t = await getTranslations("portScan");
      return { success: false, error: t("scanInProgress") };
    }

    const message = error instanceof Error ? error.message : "Port scan failed to start";
    return { success: false, error: message };
  }
}

/** Single round-trip poll: lightweight status while running, full scan when finished. */
export async function pollPortScanAction(scanId: string, serverId: string) {
  await requireUserId();
  const status = await getPortScanStatusById(scanId);
  if (!status || status.serverId !== serverId) {
    return null;
  }
  if (status.status === "SUCCESS" || status.status === "FAILED") {
    return getPortScanById(scanId);
  }
  return status;
}

export async function getLatestPortScanForServerAction(serverId: string) {
  await requireUserId();
  return getLatestPortScan(serverId);
}
