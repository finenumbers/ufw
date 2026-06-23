"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { decodeServerAddress, getServerPath } from "@/lib/server-path";
import { serverSchema, type ServerInput } from "@/lib/validations/server";
import {
  createServer,
  deleteServer,
  getServerByHost,
  getServerById,
  listServers,
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
  return listServers();
}

export async function getServerByAddressAction(serverAddress: string) {
  await requireUserId();
  const host = decodeServerAddress(serverAddress);
  return getServerByHost(host);
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
    return result;
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
  if (!result.success) return result;

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
  return testServerConnection(serverId, userId);
}

export async function syncRemoteRulesAction(
  serverId: string,
): Promise<{ success: boolean; error?: string }> {
  return runRemoteRulesSync(serverId, { forceDraft: false });
}

export async function forceResyncFromRemoteAction(
  serverId: string,
): Promise<{ success: boolean; error?: string }> {
  return runRemoteRulesSync(serverId, { forceDraft: true });
}

async function runRemoteRulesSync(
  serverId: string,
  options: { forceDraft: boolean },
): Promise<{ success: boolean; error?: string }> {
  const userId = await requireUserId();
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
    await refreshRemoteRules(serverId, userId, tracker, {
      forceDraft: options.forceDraft,
    });
    await revalidateServerPaths(serverId);
    await tracker.complete({ key: "messages.sync_complete" });
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed";
    await tracker.fail({ key: "messages.operation_failed", params: { error: message } }, [message]);
    return { success: false, error: message };
  }
}

export async function loadUfwStateAction(serverId: string) {
  const userId = await requireUserId();
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
    const message = error instanceof Error ? error.message : "Refresh failed";
    await tracker.fail({ key: "messages.operation_failed", params: { error: message } }, [message]);
    throw error;
  }
}

export async function installUfwAction(
  serverId: string,
): Promise<{ success: boolean; message: string }> {
  const userId = await requireUserId();
  const tracker = await startOperation({
    serverId,
    userId,
    type: "ufw.install",
    messageI18n: { key: "messages.install_start" },
    steps: [semanticStep("install", "steps.install")],
  });

  try {
    const result = await remoteInstallUfw(serverId, {
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
      metadata: { success: result.success },
    });

    if (!result.success) {
      await tracker.failStep("install", result.message);
      await tracker.fail(
        { key: "messages.operation_failed", params: { error: result.message } },
        [result.message],
      );
      await revalidateServerPaths(serverId);
      return result;
    }

    await tracker.completeStep("install");
    await tracker.complete({ key: "messages.install_complete" });
    await revalidateServerPaths(serverId);
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Install failed";
    await tracker.fail({ key: "messages.operation_failed", params: { error: message } }, [message]);
    return { success: false, message };
  }
}

export async function enableUfwAction(
  serverId: string,
): Promise<{ success: boolean; message: string }> {
  const userId = await requireUserId();
  const tracker = await startOperation({
    serverId,
    userId,
    type: "ufw.enable",
    messageI18n: { key: "messages.enable_start" },
    steps: [
      semanticStep("enable", "steps.enable"),
      semanticStep("load_ufw", "steps.load_ufw"),
      semanticStep("draft_sync", "steps.draft_sync"),
    ],
  });

  try {
    const result = await remoteEnableUfw(serverId, {
      onStart: async () => {
        await tracker.markRunning();
        await tracker.startStep("enable", semanticStep("enable", "steps.enable"));
      },
    });

    await createAuditEvent({
      userId,
      action: "UFW_ENABLE",
      entityType: "server",
      entityId: serverId,
      metadata: { success: result.success },
    });

    if (!result.success) {
      await tracker.failStep("enable", result.message);
      await tracker.fail(
        { key: "messages.operation_failed", params: { error: result.message } },
        [result.message],
      );
      await revalidateServerPaths(serverId);
      return result;
    }

    await tracker.completeStep("enable");
    await refreshRemoteRules(serverId, userId, tracker);
    await tracker.complete({ key: "messages.enable_complete" });
    await revalidateServerPaths(serverId);
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Enable failed";
    await tracker.fail({ key: "messages.operation_failed", params: { error: message } }, [message]);
    return { success: false, message };
  }
}
