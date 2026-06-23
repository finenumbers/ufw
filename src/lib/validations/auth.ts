import type { AuthMethod } from "@prisma/client";
import { z } from "zod";

import { validateSshHost } from "@/lib/validations/ssh-host";

export const setupSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SetupInput = z.infer<typeof setupSchema>;

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const serverSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    host: z.string().min(1, "Host is required"),
    port: z.coerce.number().int().min(1).max(65535),
    username: z.string().min(1, "Username is required"),
    authMethod: z.nativeEnum(
      {
        PASSWORD: "PASSWORD",
        PRIVATE_KEY: "PRIVATE_KEY",
        PRIVATE_KEY_WITH_PASSPHRASE: "PRIVATE_KEY_WITH_PASSPHRASE",
      } as const satisfies Record<AuthMethod, AuthMethod>,
    ),
    password: z.string().optional(),
    privateKey: z.string().optional(),
    passphrase: z.string().optional(),
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

    if (data.authMethod === "PASSWORD" && !data.password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Password is required",
        path: ["password"],
      });
    }
    if (
      (data.authMethod === "PRIVATE_KEY" ||
        data.authMethod === "PRIVATE_KEY_WITH_PASSPHRASE") &&
      !data.privateKey
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Private key is required",
        path: ["privateKey"],
      });
    }
    if (
      data.authMethod === "PRIVATE_KEY_WITH_PASSPHRASE" &&
      !data.passphrase
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passphrase is required",
        path: ["passphrase"],
      });
    }
  });

export type ServerInput = z.infer<typeof serverSchema>;

export const ruleCoreSchema = z.object({
  action: z.enum(["ALLOW", "DENY", "REJECT", "LIMIT"]),
  direction: z.enum(["IN", "OUT", "ROUTE"]).nullable().optional(),
  interface: z.string().nullable().optional(),
  protocol: z.enum(["TCP", "UDP", "ICMP", "ANY"]).nullable().optional(),
  fromAddress: z.string().nullable().optional(),
  fromPort: z.string().nullable().optional(),
  toAddress: z.string().nullable().optional(),
  toPort: z.string().nullable().optional(),
  appName: z.string().nullable().optional(),
  logMode: z.enum(["NONE", "LOG", "LOG_ALL"]).default("NONE"),
  ruleComment: z.string().nullable().optional(),
  ipv6: z.boolean().default(false),
});

export const ruleDraftRowSchema = z.object({
  clientRowId: z.string(),
  fingerprint: z.string(),
  core: ruleCoreSchema,
  ui: z.object({
    group: z.string().nullable().optional(),
    name: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
  }),
  sortOrder: z.number().int(),
  isDeleted: z.boolean().optional(),
});

export const draftUpdateSchema = z.object({
  serverId: z.string(),
  rows: z.array(ruleDraftRowSchema),
});

export const importRuleRowSchema = z.object({
  action: z.enum(["ALLOW", "DENY", "REJECT", "LIMIT"]),
  direction: z.enum(["IN", "OUT", "ROUTE"]).optional(),
  interface: z.string().optional(),
  protocol: z.enum(["TCP", "UDP", "ICMP", "ANY"]).optional(),
  fromAddress: z.string().optional(),
  fromPort: z.string().optional(),
  toAddress: z.string().optional(),
  toPort: z.string().optional(),
  appName: z.string().optional(),
  logMode: z.enum(["NONE", "LOG", "LOG_ALL"]).optional(),
  ruleComment: z.string().optional(),
  ipv6: z.boolean().optional(),
  group: z.string().optional(),
  name: z.string().optional(),
  notes: z.string().optional(),
});

export type ImportRuleRow = z.infer<typeof importRuleRowSchema>;
