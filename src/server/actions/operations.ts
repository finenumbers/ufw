"use server";

import { revalidatePath } from "next/cache";

import { requireUserId, requireUserIdForAction } from "@/lib/auth/require-user";
import { assertRateLimit } from "@/lib/rate-limit";
import { TABLE_PAGE_SIZE } from "@/lib/pagination/table-page-size";
import { listAuditEvents } from "@/server/services/audit.service";
import { listOperationLogs } from "@/server/services/operation-log.service";
import { clearOperationsHistory } from "@/server/services/operations-history.service";

export async function getOperationLogsPageAction(page: number) {
  await requireUserId();
  return listOperationLogs({ page, pageSize: TABLE_PAGE_SIZE });
}

export async function getAuditEventsPageAction(page: number) {
  await requireUserId();
  return listAuditEvents({ page, pageSize: TABLE_PAGE_SIZE });
}

export async function clearOperationsHistoryAction(): Promise<
  { success: true } | { success: false; error: string }
> {
  const auth = await requireUserIdForAction();
  if (!auth.ok) {
    return auth.failure;
  }

  const rateLimit = assertRateLimit(`operations:clear:${auth.userId}`, {
    limit: 5,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    return { success: false, error: "Too many requests. Please try again later." };
  }

  const result = await clearOperationsHistory(auth.userId);
  if (!result.success) {
    return result;
  }

  revalidatePath("/operations");
  return { success: true };
}
