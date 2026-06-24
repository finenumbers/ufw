import { z } from "zod";

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
