"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import type { PortScanProfile } from "@prisma/client";

import { auth } from "@/lib/auth";
import { isPortScanEnabled } from "@/lib/port-scan/config";
import { assertRateLimit } from "@/lib/rate-limit";
import { getServerPath } from "@/lib/server-path";
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
  profile: PortScanProfile = "TOP1000",
): Promise<
  | { success: true; scanId: string; operationId: string }
  | { success: false; error: string }
> {
  if (!isPortScanEnabled()) {
    return { success: false, error: "Port scanning is disabled on this installation." };
  }

  const userId = await requireUserId();
  const rateLimit = assertRateLimit(`port-scan:${serverId}`, {
    limit: 1,
    windowMs: 900_000,
  });

  if (!rateLimit.allowed) {
    return {
      success: false,
      error: "Port scan was run recently for this server. Please wait before scanning again.",
    };
  }

  try {
    const result = await startPortScan({ serverId, userId, profile });
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
