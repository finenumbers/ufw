import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import type { ActionErrorResult } from "@/types/action-result";

export const SESSION_EXPIRED_ERROR = "Session expired. Please sign in again.";

export async function requireUserId(): Promise<string> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session.user.id;
}

export function unauthorizedActionFailure(): ActionErrorResult {
  return { success: false, error: SESSION_EXPIRED_ERROR };
}

export async function requireUserIdForAction(): Promise<
  { ok: true; userId: string } | { ok: false; failure: ActionErrorResult }
> {
  try {
    const userId = await requireUserId();
    return { ok: true, userId };
  } catch {
    return { ok: false, failure: unauthorizedActionFailure() };
  }
}
