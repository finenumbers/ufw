"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { assertRateLimit } from "@/lib/rate-limit";
import type { UnifiedRuleRow } from "@/types/rule";
import { getServerPath } from "@/lib/server-path";
import { getServerById } from "@/server/services/server.service";
import { buildUnifiedRulesViewPage } from "@/server/services/rules-view.service";
import { importRulesToDraft } from "@/server/services/import.service";
import { getDistinctRuleFieldValues } from "@/server/services/draft.service";
import { getSnapshotInterfaceOptions } from "@/server/services/snapshot.service";
import {
  detectImportFormat,
  parseImportFile,
} from "@/lib/imports/normalize-import";
import { assertImportFileSize } from "@/lib/imports/import-limits";
import { TABLE_PAGE_SIZE } from "@/lib/pagination/table-page-size";

async function requireUserId(): Promise<string> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session.user.id;
}

async function revalidateServerPaths(serverId: string) {
  const server = await getServerById(serverId);
  if (!server) return;

  revalidatePath(getServerPath(server.host));
  revalidatePath(getServerPath(server.host, "/edit"));
}

export async function getRulesViewPageAction(
  serverId: string,
  offset = 0,
): Promise<Awaited<ReturnType<typeof buildUnifiedRulesViewPage>>> {
  const userId = await requireUserId();
  return buildUnifiedRulesViewPage(serverId, userId, offset, TABLE_PAGE_SIZE);
}

export async function getDistinctRuleFieldValuesAction(
  serverId: string,
  kind: "GROUP" | "NAME",
) {
  const userId = await requireUserId();
  return getDistinctRuleFieldValues(serverId, userId, kind);
}

export async function getInterfaceOptionsAction(serverId: string): Promise<string[]> {
  await requireUserId();
  return getSnapshotInterfaceOptions(serverId);
}

export async function importRulesAction(
  serverId: string,
  formData: FormData,
): Promise<
  | { success: true; rows: UnifiedRuleRow[]; duplicateCount: number }
  | { success: false; error: string }
> {
  const userId = await requireUserId();
  const rateLimit = assertRateLimit(`import:${userId}`, { limit: 10, windowMs: 60_000 });
  if (!rateLimit.allowed) {
    return { success: false, error: "Too many import attempts. Please try again later." };
  }

  const file = formData.get("file");

  if (!(file instanceof File)) {
    return { success: false, error: "No file provided" };
  }

  try {
    assertImportFileSize(file.size);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Import file is too large";
    return { success: false, error: message };
  }

  const format = detectImportFormat(file.name);
  if (!format) {
    return { success: false, error: "Unsupported file format" };
  }

  try {
    const content =
      format === "xlsx"
        ? await file.arrayBuffer()
        : await file.text();

    const imported = await parseImportFile(content, format);
    const { rows, duplicateCount } = await importRulesToDraft(serverId, userId, imported);
    await revalidateServerPaths(serverId);
    return { success: true, rows, duplicateCount };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Import failed";
    return { success: false, error: message };
  }
}
