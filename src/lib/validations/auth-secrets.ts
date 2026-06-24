import type { AuthMethod } from "@prisma/client";
import { z } from "zod";

export const authMethodSchema = z.enum([
  "PASSWORD",
  "PRIVATE_KEY",
  "PRIVATE_KEY_WITH_PASSPHRASE",
]) as z.ZodType<AuthMethod>;

export type AuthSecretsInput = {
  authMethod: AuthMethod;
  password?: string;
  privateKey?: string;
  passphrase?: string;
};

export function refineAuthSecrets(
  data: AuthSecretsInput,
  ctx: z.RefinementCtx,
  options: { requireSecrets: boolean } = { requireSecrets: true },
): void {
  if (!options.requireSecrets) {
    return;
  }

  if (data.authMethod === "PASSWORD" && !data.password) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Password is required",
      path: ["password"],
    });
  }

  if (
    (data.authMethod === "PRIVATE_KEY" || data.authMethod === "PRIVATE_KEY_WITH_PASSPHRASE") &&
    !data.privateKey
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Private key is required",
      path: ["privateKey"],
    });
  }

  if (data.authMethod === "PRIVATE_KEY_WITH_PASSPHRASE" && !data.passphrase) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Passphrase is required",
      path: ["passphrase"],
    });
  }
}
