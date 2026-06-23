export type UfwStatus = {
  installed: boolean;
  active: boolean;
  rawStatus: string;
  defaultIncoming?: string;
  defaultOutgoing?: string;
};

export type ParsedRemoteRule = {
  ruleNumber?: number;
  rawLine: string;
  core: import("@/types/rule").RuleCore;
  fingerprint: string;
};

export type UfwDetectionResult = {
  installed: boolean;
  active: boolean;
  status: UfwStatus;
  rules: ParsedRemoteRule[];
  interfaces: string[];
};
