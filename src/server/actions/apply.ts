"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { assertRateLimit } from "@/lib/rate-limit";
import { getServerPath } from "@/lib/server-path";
import type { UnifiedRuleRow } from "@/types/rule";
import type { ApplyPreviewResult } from "@/types/apply";
import { previewApply, confirmApply, getApplySession } from "@/server/services/apply.service";
import { getServerById } from "@/server/services/server.service";

async function requireUserId(): Promise<string> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session.user.id;
}

export async function previewApplyAction(
  serverId: string,
  desired: UnifiedRuleRow[],
): Promise<{ success: true; data: ApplyPreviewResult } | { success: false; error: string }> {
  const userId = await requireUserId();
  try {
    const data = await previewApply(serverId, userId, desired);
    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Preview failed";
    return { success: false, error: message };
  }
}

export async function confirmApplyAction(
  sessionId: string,
): Promise<{
  success: boolean;
  error?: string;
  partial?: boolean;
  needsResync?: boolean;
}> {
  const userId = await requireUserId();
  const rateLimit = assertRateLimit(`apply:${userId}`, { limit: 5, windowMs: 60_000 });
  if (!rateLimit.allowed) {
    return { success: false, error: "Too many apply attempts. Please try again later." };
  }

    const result = await confirmApply(sessionId, userId);
    if (result.success) {
    const session = await getApplySession(sessionId);
    if (session) {
      const server = await getServerById(session.serverId);
      if (server) {
        revalidatePath(getServerPath(server.host));
      }
    }
    revalidatePath("/servers");
    revalidatePath("/operations");
  }
  return result;
}

