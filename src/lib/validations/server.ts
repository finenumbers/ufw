import { z } from "zod";

import { validateSshHost } from "@/lib/validations/ssh-host";

export const serverSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    host: z.string().min(1, "Host is required"),
    port: z.coerce.number().int().min(1).max(65535),
    identityId: z.string().min(1, "Identity is required"),
  })
  .superRefine((data, ctx) => {
    const hostError = validateSshHost(data.host);
    if (hostError) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: hostError,
        path: ["host"],
      });
    }
  });

export type ServerInput = z.infer<typeof serverSchema>;
