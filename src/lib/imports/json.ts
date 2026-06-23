import { importRuleRowSchema, type ImportRuleRow } from "@/lib/validations/import";

export function parseJsonRules(content: string): ImportRuleRow[] {
  const data = JSON.parse(content) as unknown;

  if (!Array.isArray(data)) {
    throw new Error("JSON import must be an array of rules");
  }

  return data.map((row) => importRuleRowSchema.parse(row));
}
