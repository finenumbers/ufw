"use server";

import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { assertRateLimit, getClientIp } from "@/lib/rate-limit";
import { setupSchema, type SetupInput } from "@/lib/validations/auth";
import { createAuditEvent } from "@/server/services/audit.service";
import {
  acquireSetupLock,
  assertSetupAvailable,
  releaseSetupLock,
} from "@/server/services/setup.service";

export async function completeSetupAction(
  input: SetupInput,
): Promise<{ success: true } | { success: false; error: string }> {
  const requestHeaders = await headers();
  const ip = getClientIp(requestHeaders);
  const rateLimit = assertRateLimit(`setup:${ip}`, { limit: 5, windowMs: 60_000 });
  if (!rateLimit.allowed) {
    return { success: false, error: "Too many setup attempts. Please try again later." };
  }

  const parsed = setupSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  const lockAcquired = await acquireSetupLock();
  if (!lockAcquired) {
    return { success: false, error: "Setup is already in progress. Please try again." };
  }

  try {
    await assertSetupAvailable();

    await auth.api.signUpEmail({
      body: {
        email: parsed.data.email,
        password: parsed.data.password,
        name: parsed.data.name,
      },
    });

    const userCount = await db.user.count();
    if (userCount !== 1) {
      throw new Error("Setup failed due to concurrent registration");
    }

    const user = await db.user.findUnique({ where: { email: parsed.data.email } });
    await createAuditEvent({
      userId: user?.id,
      action: "SETUP_COMPLETED",
      metadata: { email: parsed.data.email },
    });

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Setup failed";
    return { success: false, error: message };
  } finally {
    await releaseSetupLock();
  }
}
