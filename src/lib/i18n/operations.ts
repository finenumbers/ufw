import type { OperationI18nRef } from "@/types/operation";

export function resolveOperationText(
  translate: (key: string, values?: Record<string, string | number>) => string,
  ref?: OperationI18nRef,
  legacy?: string | null,
): string | null {
  if (ref?.key) {
    try {
      return translate(ref.key, ref.params);
    } catch {
      return legacy ?? ref.key;
    }
  }

  if (legacy && !legacy.startsWith("messages.") && !legacy.startsWith("phases.") && !legacy.startsWith("steps.")) {
    return legacy;
  }

  if (legacy) {
    try {
      return translate(legacy);
    } catch {
      return legacy;
    }
  }

  return null;
}

export function resolveStepLabel(
  translate: (key: string, values?: Record<string, string | number>) => string,
  step: { label?: string; labelI18n?: OperationI18nRef; kind?: string },
): string {
  if (step.kind === "command" && step.label) {
    return step.label;
  }

  if (step.labelI18n?.key) {
    try {
      return translate(step.labelI18n.key, step.labelI18n.params);
    } catch {
      return step.label ?? step.labelI18n.key;
    }
  }

  if (step.label) {
    if (step.label.startsWith("steps.")) {
      try {
        return translate(step.label);
      } catch {
        return step.label;
      }
    }
    return step.label;
  }

  return "";
}
