/** Column order matches the rules table (excluding the delete column). */
export const RULES_FILE_COLUMNS = [
  "group",
  "name",
  "action",
  "direction",
  "interface",
  "fromAddress",
  "fromPort",
  "toAddress",
  "toPort",
  "protocol",
  "logMode",
  "ipv6",
  "appName",
  "ruleComment",
  "notes",
] as const;

export type RulesFileColumn = (typeof RULES_FILE_COLUMNS)[number];
