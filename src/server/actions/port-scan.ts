"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { checkOperationRateLimit, createRateLimitedFailure } from "@/lib/operation-rate-limit";
import { isPortScanEnabled } from "@/lib/port-scan/config";
import { getServerPath } from "@/lib/server-path";
import type { ActionFailureResult } from "@/types/action-result";
import {
  getLatestPortScan,
  getPortScanById,
  startPortScan,
} from "@/server/services/port-scan.service";
import { getServerById } from "@/server/services/server.service";

async function requireUserId(): Promise<string> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session.user.id;
}

export async function startPortScanAction(
  serverId: string,
): Promise<
  | { success: true; scanId: string; operationId: string }
  | ActionFailureResult
> {
  if (!isPortScanEnabled()) {
    return { success: false, error: "Port scanning is disabled on this installation." };
  }

  const userId = await requireUserId();
  const rateLimit = checkOperationRateLimit(`port-scan:${serverId}`);

  if (!rateLimit.allowed) {
    return createRateLimitedFailure(rateLimit.retryAfterMs);
  }

  try {
    const result = await startPortScan({ serverId, userId });
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

export async function getLatestPortScanAction(serverId: string) {
  await requireUserId();
  return getLatestPortScan(serverId);
}

export async function getPortScanByIdAction(scanId: string) {
  await requireUserId();
  return getPortScanById(scanId);
}
