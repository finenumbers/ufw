import type { ApplyItemAction } from "@prisma/client";

import type { RuleCore, RuleUiMetadata } from "@/types/rule";

export type ApplyPlanItem = {
  action: ApplyItemAction;
  fingerprint: string;
  before?: { core: RuleCore; ui: RuleUiMetadata };
  after?: { core: RuleCore; ui: RuleUiMetadata };
  remoteCommand?: string;
  sortOrder: number;
};

export type ApplyPlan = {
  items: ApplyPlanItem[];
  summary: {
    addCount: number;
    removeCount: number;
    updateCount: number;
    dbSync?: boolean;
    orderResync?: boolean;
  };
};

export type ApplyPreviewResult = {
  sessionId: string;
  plan: ApplyPlan;
};
