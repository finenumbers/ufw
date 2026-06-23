import type { OperationStatus, Prisma } from "@prisma/client";

import type { OperationI18nRef, OperationMetadata, OperationStep } from "@/types/operation";
import {
  createOperationLog,
  updateOperationLog,
} from "@/server/services/operation-log.service";

export type OperationTracker = {
  operationId: string;
  markRunning(): Promise<void>;
  setPhase(phase: string, phaseI18n: OperationI18nRef): Promise<void>;
  setProgress(current: number, total: number, messageI18n?: OperationI18nRef): Promise<void>;
  addStep(step: OperationStep): Promise<void>;
  startStep(id: string, step?: OperationStep): Promise<void>;
  completeStep(id: string): Promise<void>;
  failStep(id: string, error: string): Promise<void>;
  complete(messageI18n: OperationI18nRef, summary?: Record<string, number>): Promise<void>;
  fail(messageI18n: OperationI18nRef, errors?: string[]): Promise<void>;
};

export function mergeOperationMetadata(
  current: OperationMetadata | undefined,
  patch: Partial<OperationMetadata>,
): OperationMetadata {
  const merged: OperationMetadata = {
    ...current,
    ...patch,
    errors: patch.errors ?? current?.errors ?? [],
  };

  if (patch.steps) {
    merged.steps = patch.steps;
  } else if (current?.steps) {
    merged.steps = current.steps;
  }

  return merged;
}

export function upsertStep(
  steps: OperationStep[] | undefined,
  step: OperationStep,
): OperationStep[] {
  const next = [...(steps ?? [])];
  const index = next.findIndex((item) => item.id === step.id);
  if (index >= 0) {
    next[index] = { ...next[index], ...step };
  } else {
    next.push(step);
  }
  return next;
}

export function updateStepStatus(
  steps: OperationStep[] | undefined,
  id: string,
  status: OperationStep["status"],
  patch?: Partial<OperationStep>,
): OperationStep[] {
  return (steps ?? []).map((step) =>
    step.id === id ? { ...step, ...patch, status } : step,
  );
}

function semanticStep(id: string, labelKey: string): OperationStep {
  return {
    id,
    kind: "semantic",
    labelI18n: { key: labelKey },
    status: "PENDING",
  };
}

function commandStep(id: string, command: string): OperationStep {
  return {
    id,
    kind: "command",
    label: command,
    status: "PENDING",
  };
}

export { semanticStep, commandStep };

export async function startOperation(params: {
  serverId?: string | null;
  userId?: string | null;
  type: string;
  messageI18n: OperationI18nRef;
  steps?: OperationStep[];
  metadata?: Partial<OperationMetadata>;
}): Promise<OperationTracker> {
  const metadata = mergeOperationMetadata(undefined, {
    steps: params.steps ?? [],
    errors: [],
    messageI18n: params.messageI18n,
    ...params.metadata,
  });

  const log = await createOperationLog({
    serverId: params.serverId,
    userId: params.userId,
    type: params.type,
    status: "PENDING",
    message: params.messageI18n.key,
    metadata: metadata as Prisma.InputJsonValue,
  });

  let currentMetadata = metadata;
  let currentMessageKey = params.messageI18n.key;

  async function persist(status?: OperationStatus, messageI18n?: OperationI18nRef) {
    if (messageI18n) {
      currentMessageKey = messageI18n.key;
      currentMetadata = mergeOperationMetadata(currentMetadata, { messageI18n });
    }

    await updateOperationLog(log.id, {
      status,
      message: currentMessageKey,
      metadata: currentMetadata as Prisma.InputJsonValue,
    });
  }

  const tracker: OperationTracker = {
    operationId: log.id,

    async markRunning() {
      await persist("RUNNING");
    },

    async setPhase(phase, phaseI18n) {
      currentMetadata = mergeOperationMetadata(currentMetadata, {
        phase,
        phaseI18n,
        phaseLabel: undefined,
      });
      await persist();
    },

    async setProgress(current, total, messageI18n) {
      currentMetadata = mergeOperationMetadata(currentMetadata, { current, total });
      await persist(undefined, messageI18n);
    },

    async addStep(step) {
      currentMetadata = mergeOperationMetadata(currentMetadata, {
        steps: upsertStep(currentMetadata.steps, step),
      });
      await persist();
    },

    async startStep(id, step) {
      const existing = currentMetadata.steps?.find((item) => item.id === id);
      currentMetadata = mergeOperationMetadata(currentMetadata, {
        steps: upsertStep(currentMetadata.steps, {
          id,
          kind: step?.kind ?? existing?.kind ?? "semantic",
          label: step?.label ?? existing?.label,
          labelI18n: step?.labelI18n ?? existing?.labelI18n,
          status: "RUNNING",
        }),
      });
      await persist();
    },

    async completeStep(id) {
      currentMetadata = mergeOperationMetadata(currentMetadata, {
        steps: updateStepStatus(currentMetadata.steps, id, "SUCCESS"),
      });
      await persist();
    },

    async failStep(id, error) {
      const errors = [...(currentMetadata.errors ?? []), error];
      currentMetadata = mergeOperationMetadata(currentMetadata, {
        errors,
        steps: updateStepStatus(currentMetadata.steps, id, "FAILED", { error }),
      });
      await persist();
    },

    async complete(messageI18n, summary) {
      currentMetadata = mergeOperationMetadata(currentMetadata, {
        summary,
        finishedAt: new Date().toISOString(),
        messageI18n,
      });
      await persist("SUCCESS", messageI18n);
    },

    async fail(messageI18n, errors) {
      const mergedErrors = [...(currentMetadata.errors ?? []), ...(errors ?? [])];
      currentMetadata = mergeOperationMetadata(currentMetadata, {
        errors: mergedErrors,
        finishedAt: new Date().toISOString(),
        messageI18n,
      });
      await persist("FAILED", messageI18n);
    },
  };

  return tracker;
}
