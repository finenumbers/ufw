import type { AuthMethod } from "@prisma/client";
import { z } from "zod";

import { authMethodSchema, refineAuthSecrets } from "@/lib/validations/auth-secrets";

export const identityCreateSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    username: z.string().min(1, "Username is required"),
    authMethod: authMethodSchema,
    password: z.string().optional(),
    privateKey: z.string().optional(),
    passphrase: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    refineAuthSecrets(data, ctx, { requireSecrets: true });
  });

export const identityUpdateSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    username: z.string().min(1, "Username is required"),
    authMethod: authMethodSchema,
    password: z.string().optional(),
    privateKey: z.string().optional(),
    passphrase: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const hasSecretUpdate =
      Boolean(data.password) || Boolean(data.privateKey) || Boolean(data.passphrase);
    if (hasSecretUpdate) {
      refineAuthSecrets(data, ctx, { requireSecrets: true });
    }
  });

export type IdentityCreateInput = z.infer<typeof identityCreateSchema>;
export type IdentityUpdateInput = z.infer<typeof identityUpdateSchema>;

export type IdentityListItem = {
  id: string;
  name: string;
  username: string;
  authMethod: AuthMethod;
  serverCount: number;
};

export type IdentityDetail = IdentityListItem & {
  linkedServers: Array<{ id: string; name: string; host: string; port: number }>;
};
