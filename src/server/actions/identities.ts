"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { assertRateLimit } from "@/lib/rate-limit";
import {
  identityCreateSchema,
  identityUpdateSchema,
  type IdentityCreateInput,
  type IdentityUpdateInput,
} from "@/lib/validations/identity";
import {
  createIdentity,
  deleteIdentity,
  getIdentityById,
  listIdentities,
  updateIdentity,
} from "@/server/services/identity.service";

async function requireUserId(): Promise<string> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session.user.id;
}

export async function listIdentitiesAction() {
  await requireUserId();
  return listIdentities();
}

export async function getIdentityByIdAction(id: string) {
  await requireUserId();
  return getIdentityById(id);
}

export async function createIdentityAction(
  input: IdentityCreateInput,
): Promise<{ success: true; id: string } | { success: false; error: string }> {
  const userId = await requireUserId();
  const rateLimit = assertRateLimit(`identity:create:${userId}`, {
    limit: 20,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    return { success: false, error: "Too many requests. Please try again later." };
  }

  const parsed = identityCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  const result = await createIdentity(parsed.data, userId);
  if (!result.success) {
    return result;
  }

  revalidatePath("/identities");
  revalidatePath("/servers/new");
  return { success: true, id: result.identity.id };
}

export async function updateIdentityAction(
  id: string,
  input: IdentityUpdateInput,
): Promise<{ success: true } | { success: false; error: string }> {
  const userId = await requireUserId();
  const rateLimit = assertRateLimit(`identity:update:${userId}`, {
    limit: 30,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    return { success: false, error: "Too many requests. Please try again later." };
  }

  const parsed = identityUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  const result = await updateIdentity(id, parsed.data, userId);
  if (!result.success) {
    return result;
  }

  revalidatePath("/identities");
  revalidatePath(`/identities/${id}/edit`);
  revalidatePath("/servers");
  return { success: true };
}

export async function deleteIdentityAction(
  id: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const userId = await requireUserId();
  const rateLimit = assertRateLimit(`identity:delete:${userId}`, {
    limit: 20,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    return { success: false, error: "Too many requests. Please try again later." };
  }

  const result = await deleteIdentity(id, userId);
  if (!result.success) {
    return result;
  }

  revalidatePath("/identities");
  revalidatePath("/servers");
  return { success: true };
}
