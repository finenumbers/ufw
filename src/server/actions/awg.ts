"use server";

import { verifyUserPassword } from "@/lib/auth/password-verify";
import { requireUserIdForAction } from "@/lib/auth/require-user";
import { assertRateLimit } from "@/lib/rate-limit";
import type { AwgRouteSnapshot } from "@/lib/awg/route-plan";
import {
  awgRouteError,
  listAwgRoutes,
  removeOrphanAwgRoute,
  removeServerFromAwg,
} from "@/server/services/awg-routes.service";
import {
  deleteAwgConfig,
  getAwgPublicStatus,
  saveAwgConfig,
  setAwgEnabled,
  type AwgPublicStatus,
} from "@/server/services/awg.service";

async function authorized(): Promise<{ ok: true; userId: string } | { ok: false; error: string }> {
  const auth = await requireUserIdForAction();
  if (!auth.ok) {
    return { ok: false, error: auth.failure.error };
  }
  const limit = assertRateLimit(`awg:${auth.userId}`, { limit: 20, windowMs: 60_000 });
  if (!limit.allowed) {
    return { ok: false, error: "Too many AmneziaWG changes. Wait a moment and try again." };
  }
  return { ok: true, userId: auth.userId };
}

const EMPTY_ROUTES: AwgRouteSnapshot = {
  availability: "helper-error",
  canRemove: false,
  servers: [],
  orphans: [],
};

export async function getAwgRoutesAction(): Promise<AwgRouteSnapshot> {
  const auth = await requireUserIdForAction();
  if (!auth.ok) return EMPTY_ROUTES;
  return listAwgRoutes();
}

export async function removeAwgServerAction(
  serverId: string,
): Promise<{ success: true; routeKept: boolean } | { success: false; error: string }> {
  const auth = await authorized();
  if (!auth.ok) return { success: false, error: auth.error };
  try {
    const result = await removeServerFromAwg(serverId, auth.userId);
    return { success: true, routeKept: result.routeKept };
  } catch (error) {
    return {
      success: false,
      error: awgRouteError(error, "Could not remove the AmneziaWG route"),
    };
  }
}

export async function removeAwgOrphanAction(
  ip: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const auth = await authorized();
  if (!auth.ok) return { success: false, error: auth.error };
  try {
    await removeOrphanAwgRoute(ip);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: awgRouteError(error, "Could not remove the AmneziaWG route"),
    };
  }
}

export async function getAwgStatusAction(): Promise<AwgPublicStatus> {
  const auth = await requireUserIdForAction();
  if (!auth.ok) {
    return {
      configured: false,
      enabled: false,
      leader: false,
      up: false,
      handshakeAgeSec: null,
      address: null,
      endpoint: null,
      allowedIps: null,
      updatedAt: null,
      error: auth.failure.error,
    };
  }
  return getAwgPublicStatus();
}

export async function saveAwgConfigAction(
  conf: string,
  password: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const auth = await authorized();
  if (!auth.ok) {
    return { success: false, error: auth.error };
  }
  const valid = await verifyUserPassword(auth.userId, password);
  if (!valid) {
    return { success: false, error: "Password is incorrect" };
  }
  try {
    await saveAwgConfig(conf, auth.userId);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not apply AmneziaWG config",
    };
  }
}

export async function setAwgEnabledAction(
  enabled: boolean,
): Promise<{ success: true } | { success: false; error: string }> {
  const auth = await authorized();
  if (!auth.ok) {
    return { success: false, error: auth.error };
  }
  try {
    await setAwgEnabled(enabled, auth.userId);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not change AmneziaWG",
    };
  }
}

export async function deleteAwgConfigAction(
  password: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const auth = await authorized();
  if (!auth.ok) {
    return { success: false, error: auth.error };
  }
  const valid = await verifyUserPassword(auth.userId, password);
  if (!valid) {
    return { success: false, error: "Password is incorrect" };
  }
  try {
    await deleteAwgConfig(auth.userId);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not delete AmneziaWG config",
    };
  }
}
