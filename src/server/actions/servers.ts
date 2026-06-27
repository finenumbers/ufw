"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";

import { verifyUserPassword } from "@/lib/auth/password-verify";
import { auth } from "@/lib/auth";
import { createExportToken } from "@/lib/export-token";
import {
  sanitizeConfigImportError,
  sanitizeGenericClientError,
} from "@/lib/errors/sanitize";
import { assertImportFileSize } from "@/lib/imports/import-limits";
import {
  checkOperationRateLimit,
  createRateLimitedFailure,
  throwIfOperationRateLimited,
} from "@/lib/operation-rate-limit";
import { assertRateLimit } from "@/lib/rate-limit";
import { decodeServerAddress, getServerPath } from "@/lib/server-path";
import type { ActionFailureResult } from "@/types/action-result";
import { serverSchema, type ServerInput } from "@/lib/validations/server";
import {
  applyServersConfigImport,
  diffServersConfigImport,
} from "@/server/services/server-config.service";
import {
  createServer,
  deleteServer,
  getServerByHost,
  getServerById,
  listServersWithRuleCounts,
  SERVER_DUPLICATE_ERROR,
  testServerConnection,
  updateServer,
} from "@/server/services/server.service";
import {
  detectUfwState,
  remoteEnableUfw,
  remoteInstallUfw,
} from "@/server/services/ssh.service";
import { refreshRemoteRules } from "@/server/services/rules-view.service";
import { createAuditEvent } from "@/server/services/audit.service";
import {
  semanticStep,
  startOperation,
} from "@/server/services/operation-progress.service";

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

export async function getServersAction() {
  await requireUserId();
  return listServersWithRuleCounts();
}

export async function getServerByAddressAction(serverAddress: string) {
  await requireUserId();
  const host = decodeServerAddress(serverAddress);
  return getServerByHost(host);
}

async function mapServerSaveError(
  error: string,
  input: ServerInput,
): Promise<string> {
  if (error !== SERVER_DUPLICATE_ERROR) {
    return error;
  }

  const t = await getTranslations("serverForm");
  return t("duplicateServer", { host: input.host, port: input.port });
}

export async function createServerAction(
  input: ServerInput,
): Promise<{ success: true; serverAddress: string } | { success: false; error: string }> {
  const userId = await requireUserId();
  const parsed = serverSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  const result = await createServer(parsed.data, userId);
  if (!result.success) {
    return {
      success: false,
      error: await mapServerSaveError(result.error, parsed.data),
    };
  }

  revalidatePath("/servers");
  return { success: true, serverAddress: result.server.host };
}

export async function updateServerAction(
  id: string,
  input: ServerInput,
): Promise<{ success: true; serverAddress: string } | { success: false; error: string }> {
  const userId = await requireUserId();
  const parsed = serverSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  const existing = await getServerById(id);
  const result = await updateServer(id, parsed.data, userId);
  if (!result.success) {
    return {
      success: false,
      error: await mapServerSaveError(result.error, parsed.data),
    };
  }

  if (existing) {
    revalidatePath(getServerPath(existing.host));
    revalidatePath(getServerPath(existing.host, "/edit"));
  }

  revalidatePath("/servers");
  revalidatePath(getServerPath(result.server.host));
  revalidatePath(getServerPath(result.server.host, "/edit"));

  return { success: true, serverAddress: result.server.host };
}

export async function deleteServerAction(
  id: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const userId = await requireUserId();
  const existing = await getServerById(id);
  if (!existing) {
    return { success: false, error: "Server not found" };
  }

  const result = await deleteServer(id, userId);
  if (!result.success) {
    return result;
  }

  revalidatePath("/servers");
  revalidatePath(getServerPath(existing.host));
  revalidatePath(getServerPath(existing.host, "/edit"));
  revalidatePath("/operations");

  return { success: true };
}

export async function testServerConnectionAction(serverId: string) {
  const userId = await requireUserId();
  const rateLimit = assertRateLimit(`ssh-test:${userId}`, { limit: 10, windowMs: 60_000 });
  if (!rateLimit.allowed) {
    return {
      success: false,
      message: "Too many connection tests. Please try again later.",
    };
  }

  return testServerConnection(serverId, userId);
}

export async function syncRemoteRulesAction(
  serverId: string,
): Promise<{ success: boolean; error?: string }> {
  return runRemoteRulesSync(serverId);
}

export async function forceResyncFromRemoteAction(
  serverId: string,
): Promise<{ success: true } | ActionFailureResult> {
  return runRemoteRulesSync(serverId);
}

async function runRemoteRulesSync(
  serverId: string,
): Promise<{ success: true } | ActionFailureResult> {
  const userId = await requireUserId();

  const rateLimit = checkOperationRateLimit(`ufw-refresh:${serverId}`);
  if (!rateLimit.allowed) {
    return createRateLimitedFailure(rateLimit.retryAfterMs);
  }

  const tracker = await startOperation({
    serverId,
    userId,
    type: "ufw.sync",
    messageI18n: { key: "messages.sync_start" },
    steps: [
      semanticStep("load_ufw", "steps.load_ufw"),
      semanticStep("draft_sync", "steps.draft_sync"),
    ],
  });

  try {
    await refreshRemoteRules(serverId, userId, tracker);
    await revalidateServerPaths(serverId);
    await tracker.complete({ key: "messages.sync_complete" });
    return { success: true };
  } catch (error) {
    const message = sanitizeGenericClientError(error, "Sync failed");
    await tracker.fail({ key: "messages.operation_failed", params: { error: message } }, [message]);
    return { success: false, error: message };
  }
}

export async function loadUfwStateAction(serverId: string) {
  const userId = await requireUserId();

  throwIfOperationRateLimited(`ufw-refresh:${serverId}`);

  const tracker = await startOperation({
    serverId,
    userId,
    type: "ufw.refresh",
    messageI18n: { key: "messages.refresh_start" },
    steps: [semanticStep("detect", "steps.detect")],
  });

  try {
    const state = await detectUfwState(serverId, {
      onStart: async () => {
        await tracker.markRunning();
        await tracker.startStep("detect", semanticStep("detect", "steps.detect"));
      },
    });
    await tracker.completeStep("detect");

    if (state.installed && state.active) {
      await tracker.addStep(semanticStep("load_ufw", "steps.load_ufw"));
      await tracker.addStep(semanticStep("draft_sync", "steps.draft_sync"));
      await refreshRemoteRules(serverId, userId, tracker);
    }

    await revalidateServerPaths(serverId);
    await tracker.complete({ key: "messages.refresh_complete" });
    return state;
  } catch (error) {
    const message = sanitizeGenericClientError(error, "Refresh failed");
    await tracker.fail({ key: "messages.operation_failed", params: { error: message } }, [message]);
    throw new Error(message);
  }
}

export async function installUfwAction(
  serverId: string,
): Promise<{ success: boolean; message: string }> {
  const userId = await requireUserId();
  const rateLimit = assertRateLimit(`ufw-install:${serverId}`, { limit: 3, windowMs: 60_000 });
  if (!rateLimit.allowed) {
    return {
      success: false,
      message: "Too many install attempts. Please try again later.",
    };
  }

  const tracker = await startOperation({
    serverId,
    userId,
    type: "ufw.install",
    messageI18n: { key: "messages.install_start" },
    steps: [
      semanticStep("install", "steps.install"),
      semanticStep("enable", "steps.enable"),
      semanticStep("load_ufw", "steps.load_ufw"),
      semanticStep("draft_sync", "steps.draft_sync"),
    ],
  });

  try {
    const installResult = await remoteInstallUfw(serverId, {
      onStart: async () => {
        await tracker.markRunning();
        await tracker.startStep("install", semanticStep("install", "steps.install"));
      },
    });

    await createAuditEvent({
      userId,
      action: "UFW_INSTALL",
      entityType: "server",
      entityId: serverId,
      metadata: { success: installResult.success },
    });

    if (!installResult.success) {
      await tracker.failStep("install", installResult.message);
      await tracker.fail(
        { key: "messages.operation_failed", params: { error: installResult.message } },
        [installResult.message],
      );
      await revalidateServerPaths(serverId);
      return installResult;
    }

    await tracker.completeStep("install");

    const enableResult = await remoteEnableUfw(serverId, {
      onStart: async () => {
        await tracker.startStep("enable", semanticStep("enable", "steps.enable"));
      },
    });

    await createAuditEvent({
      userId,
      action: "UFW_ENABLE",
      entityType: "server",
      entityId: serverId,
      metadata: { success: enableResult.success },
    });

    if (!enableResult.success) {
      await tracker.failStep("enable", enableResult.message);
      await tracker.fail(
        { key: "messages.operation_failed", params: { error: enableResult.message } },
        [enableResult.message],
      );
      await revalidateServerPaths(serverId);
      return enableResult;
    }

    await tracker.completeStep("enable");

    const state = await detectUfwState(serverId);
    if (!state.installed || !state.active) {
      const message = "UFW is not active after install and enable";
      await tracker.fail(
        { key: "messages.operation_failed", params: { error: message } },
        [message],
      );
      await revalidateServerPaths(serverId);
      return { success: false, message };
    }

    await refreshRemoteRules(serverId, userId, tracker);
    await tracker.complete({ key: "messages.install_complete" });
    await revalidateServerPaths(serverId);
    return { success: true, message: "UFW installed and enabled successfully" };
  } catch (error) {
    const message = sanitizeGenericClientError(error, "Install failed");
    await tracker.fail({ key: "messages.operation_failed", params: { error: message } }, [message]);
    return { success: false, message };
  }
}

async function readConfigFile(formData: FormData): Promise<string> {
  const file = formData.get("file");

  if (!(file instanceof File)) {
    throw new Error("No file provided");
  }

  assertImportFileSize(file.size);
  return file.text();
}

export async function previewImportServersConfigAction(
  formData: FormData,
): Promise<
  | {
      success: true;
      diff: Awaited<ReturnType<typeof diffServersConfigImport>>;
    }
  | { success: false; error: string }
> {
  try {
    await requireUserId();
    const content = await readConfigFile(formData);
    const diff = await diffServersConfigImport(content);
    return { success: true, diff };
  } catch (error) {
    return { success: false, error: sanitizeConfigImportError(error) };
  }
}

export async function confirmConfigExportAction(
  password: string,
): Promise<{ success: true; token: string } | { success: false; error: string }> {
  const userId = await requireUserId();
  const rateLimit = assertRateLimit(`config-export:${userId}`, {
    limit: 5,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    return { success: false, error: "Too many export attempts. Please try again later." };
  }

  const valid = await verifyUserPassword(userId, password);
  if (!valid) {
    return { success: false, error: "Invalid password" };
  }

  return { success: true, token: createExportToken(userId) };
}

export async function importServersConfigAction(
  formData: FormData,
): Promise<
  | { success: true; diff: Awaited<ReturnType<typeof diffServersConfigImport>> }
  | { success: false; error: string }
> {
  const userId = await requireUserId();
  const rateLimit = assertRateLimit(`servers-config-import:${userId}`, {
    limit: 10,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    return { success: false, error: "Too many import attempts. Please try again later." };
  }

  try {
    const content = await readConfigFile(formData);
    const deletedHosts = (await diffServersConfigImport(content)).toDelete.map(
      (entry) => entry.host,
    );
    const { diff } = await applyServersConfigImport(content, userId);

    revalidatePath("/servers");
    for (const host of deletedHosts) {
      revalidatePath(getServerPath(host));
      revalidatePath(getServerPath(host, "/edit"));
    }

    return { success: true, diff };
  } catch (error) {
    return { success: false, error: sanitizeConfigImportError(error) };
  }
}
