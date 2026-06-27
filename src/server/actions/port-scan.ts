"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { getPortScanRateLimitWindowMs, isPortScanEnabled } from "@/lib/port-scan/config";
import { assertRateLimit } from "@/lib/rate-limit";
import { getServerPath } from "@/lib/server-path";
import {
  getLatestPortScan,
  getPortScanById,
  getRecentPortScan,
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
  | { success: true; scanId: string; operationId: string; reused?: boolean }
  | { success: false; error: string }
> {
  if (!isPortScanEnabled()) {
    return { success: false, error: "Port scanning is disabled on this installation." };
  }

  const userId = await requireUserId();
  const windowMs = getPortScanRateLimitWindowMs();
  const rateLimit = assertRateLimit(`port-scan:${serverId}`, {
    limit: 1,
    windowMs,
  });

  if (!rateLimit.allowed) {
    const recent = await getRecentPortScan(serverId, windowMs);
    if (recent) {
      return {
        success: true,
        scanId: recent.id,
        operationId: recent.operationId ?? "",
        reused: true,
      };
    }

    const retrySeconds = Math.ceil(rateLimit.retryAfterMs / 1000);
    return {
      success: false,
      error: `Port scan was run recently for this server. Please wait ${retrySeconds}s before scanning again.`,
    };
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
