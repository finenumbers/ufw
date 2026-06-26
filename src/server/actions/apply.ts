"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { sanitizeApplyClientError, sanitizeGenericClientError } from "@/lib/errors/sanitize";
import { assertRateLimit } from "@/lib/rate-limit";
import { getServerPath } from "@/lib/server-path";
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
  desired: import("@/types/rule").UnifiedRuleRow[],
): Promise<{ success: true; data: ApplyPreviewResult } | { success: false; error: string }> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    // #region agent log
    fetch("http://127.0.0.1:7609/ingest/14ecf3d2-f6bd-4c83-93e8-e6fa310f4508", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "e30bc9" },
      body: JSON.stringify({
        sessionId: "e30bc9",
        runId: "500-debug",
        hypothesisId: "B",
        location: "apply.ts:previewApplyAction:auth",
        message: "previewApplyAction auth failed",
        data: { serverId, errorMessage: message },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    return { success: false, error: "Session expired. Please sign in again." };
  }

  try {
    const data = await previewApply(serverId, userId, desired);
    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Preview failed";
    // #region agent log
    fetch("http://127.0.0.1:7609/ingest/14ecf3d2-f6bd-4c83-93e8-e6fa310f4508", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "e30bc9" },
      body: JSON.stringify({
        sessionId: "e30bc9",
        runId: "500-debug",
        hypothesisId: "A",
        location: "apply.ts:previewApplyAction",
        message: "previewApplyAction failed",
        data: {
          serverId,
          rowCount: desired.length,
          emptyFingerprintCount: desired.filter((row) => !row.fingerprint?.trim()).length,
          errorMessage: message,
          errorName: error instanceof Error ? error.name : "unknown",
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    return {
      success: false,
      error: sanitizeGenericClientError(error, "Preview failed"),
    };
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

  if (!result.success && result.error) {
    return {
      ...result,
      error: sanitizeApplyClientError([result.error]),
    };
  }

  return result;
}
