import type {
  LogMode,
  RuleAction,
  RuleDirection,
  RuleOriginState,
  RuleProtocol,
} from "@prisma/client";

export type RuleCore = {
  action: RuleAction;
  direction?: RuleDirection | null;
  interface?: string | null;
  protocol?: RuleProtocol | null;
  fromAddress?: string | null;
  fromPort?: string | null;
  toAddress?: string | null;
  toPort?: string | null;
  appName?: string | null;
  logMode: LogMode;
  ruleComment?: string | null;
  ipv6: boolean;
};

export type RuleUiMetadata = {
  group?: string | null;
  name?: string | null;
  notes?: string | null;
};

export type UnifiedRuleRow = {
  clientRowId: string;
  fingerprint: string;
  core: RuleCore;
  ui: RuleUiMetadata;
  originState: RuleOriginState;
  sources: {
    remote: boolean;
    local: boolean;
    draft: boolean;
  };
  sortOrder: number;
  rawLine?: string | null;
  isDeleted?: boolean;
  /** UFW `status numbered` rule index, when the rule exists on the server */
  ufwRuleNumber?: number | null;
  /** Client-only: row not yet written by Save Draft */
  isPendingSave?: boolean;
};

export type RuleDraftInput = UnifiedRuleRow;
