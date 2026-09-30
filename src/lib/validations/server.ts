import { z } from "zod";

import {
  DEFAULT_SSH_TARGET_POLICY,
  validateSshHost,
  type SshTargetPolicy,
} from "@/lib/validations/ssh-host";

export function createServerSchema(policy: SshTargetPolicy = DEFAULT_SSH_TARGET_POLICY) {
  return z
    .object({
      name: z.string().min(1, "Name is required"),
      host: z.string().min(1, "Host is required"),
      port: z.coerce.number().int().min(1).max(65535),
      identityId: z.string().min(1, "Identity is required"),
    })
    .superRefine((data, ctx) => {
      const hostError = validateSshHost(data.host, policy);
      if (hostError) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: hostError,
          path: ["host"],
        });
      }
    });
}

export const serverSchema = createServerSchema();

export type ServerInput = z.infer<typeof serverSchema>;
