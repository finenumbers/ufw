"use server";

import { revalidatePath } from "next/cache";

import { requireUserId, requireUserIdForAction } from "@/lib/auth/require-user";
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
  const auth = await requireUserIdForAction();
  if (!auth.ok) {
    return auth.failure;
  }

  const rateLimit = assertRateLimit(`identity:create:${auth.userId}`, {
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

  const result = await createIdentity(parsed.data, auth.userId);
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
  const auth = await requireUserIdForAction();
  if (!auth.ok) {
    return auth.failure;
  }

  const rateLimit = assertRateLimit(`identity:update:${auth.userId}`, {
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

  const result = await updateIdentity(id, parsed.data, auth.userId);
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
  const auth = await requireUserIdForAction();
  if (!auth.ok) {
    return auth.failure;
  }

  const rateLimit = assertRateLimit(`identity:delete:${auth.userId}`, {
    limit: 20,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    return { success: false, error: "Too many requests. Please try again later." };
  }

  const result = await deleteIdentity(id, auth.userId);
  if (!result.success) {
    return result;
  }

  revalidatePath("/identities");
  revalidatePath("/servers");
  return { success: true };
}
