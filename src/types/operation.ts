export type OperationI18nRef = {
  key: string;
  params?: Record<string, string | number>;
};

export type OperationStepStatus = "PENDING" | "RUNNING" | "SUCCESS" | "FAILED";

export type OperationStepKind = "semantic" | "command";

export type OperationStep = {
  id: string;
  label?: string;
  labelI18n?: OperationI18nRef;
  kind?: OperationStepKind;
  status: OperationStepStatus;
  error?: string;
};

export type OperationMetadata = {
  phase?: string;
  phaseLabel?: string;
  phaseI18n?: OperationI18nRef;
  current?: number;
  total?: number;
  steps?: OperationStep[];
  errors?: string[];
  summary?: Record<string, number>;
  finishedAt?: string;
  messageI18n?: OperationI18nRef;
};

export type ActiveOperation = {
  id: string;
  type: string;
  status: string;
  message?: string | null;
  metadata?: OperationMetadata | null;
  createdAt: string;
};

export function operationTypeToKey(type: string): string {
  return type.replace(/\./g, "_");
}

export function parseOperationMetadata(value: unknown): OperationMetadata | null {
  if (!value || typeof value !== "object") return null;
  return value as OperationMetadata;
}

export function isOperationI18nKey(message: string | null | undefined): boolean {
  if (!message) return false;
  return (
    message.startsWith("messages.") ||
    message.startsWith("phases.") ||
    message.startsWith("steps.")
  );
}
