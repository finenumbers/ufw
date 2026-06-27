"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, ChevronDown, ChevronUp, Circle, Loader2, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  dismissOperation,
  isOperationDismissed,
} from "@/lib/operations/events";
import { resolveOperationText, resolveStepLabel } from "@/lib/i18n/operations";
import { useOperationBannerPoll } from "@/lib/operations/use-operation-banner-poll";
import {
  operationTypeToKey,
  type ActiveOperation,
  type OperationStep,
} from "@/types/operation";

type OperationBannerProps = {
  serverId?: string;
};

const SUCCESS_AUTO_DISMISS_MS = 10_000;

function StepIcon({ status }: { status: OperationStep["status"] }) {
  if (status === "RUNNING") {
    return <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-amber-600" />;
  }
  if (status === "SUCCESS") {
    return <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-600" />;
  }
  if (status === "FAILED") {
    return <XCircle className="h-3.5 w-3.5 shrink-0 text-destructive" />;
  }
  return <Circle className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />;
}

export function OperationBanner({ serverId }: OperationBannerProps) {
  const t = useTranslations("operations");
  const [operation, setOperation] = useState<ActiveOperation | null>(null);
  const [expanded, setExpanded] = useState(true);

  const handleOperation = useCallback((next: ActiveOperation | null) => {
    if (next && isOperationDismissed(next.id)) {
      setOperation(null);
      return;
    }
    setOperation(next);
  }, []);

  useOperationBannerPoll({ serverId, onOperation: handleOperation });

  const translateOperation = useCallback(
    (key: string, values?: Record<string, string | number>) =>
      (t as (translationKey: string, translationValues?: Record<string, string | number>) => string)(
        key,
        values,
      ),
    [t],
  );

  const formatSummary = useCallback(
    (summary?: Record<string, number>) => {
      if (!summary) return null;
      const parts: string[] = [];
      if (summary.openCount) parts.push(t("summary.openPorts", { count: summary.openCount }));
      if (summary.enrichedCount) parts.push(t("summary.enriched", { count: summary.enrichedCount }));
      if (summary.notInUfwCount) parts.push(t("summary.notInUfw", { count: summary.notInUfwCount }));
      if (summary.containerCount) parts.push(t("summary.containers", { count: summary.containerCount }));
      if (summary.runningCount) parts.push(t("summary.running", { count: summary.runningCount }));
      if (summary.addCount) parts.push(t("summary.added", { count: summary.addCount }));
      if (summary.removeCount) parts.push(t("summary.removed", { count: summary.removeCount }));
      if (summary.updateCount) parts.push(t("summary.reordered", { count: summary.updateCount }));
      return parts.length > 0 ? parts.join(", ") : null;
    },
    [t],
  );

  useEffect(() => {
    if (!operation || operation.status !== "SUCCESS") return;

    const timer = setTimeout(() => {
      dismissOperation(operation.id);
      setOperation(null);
    }, SUCCESS_AUTO_DISMISS_MS);

    return () => clearTimeout(timer);
  }, [operation]);

  if (!operation) return null;

  const metadata = operation.metadata ?? undefined;
  const steps = metadata?.steps ?? [];
  const errors = metadata?.errors ?? [];
  const failedSteps = steps.filter((step) => step.status === "FAILED");
  const summaryText = formatSummary(metadata?.summary);

  const operationMessage = resolveOperationText(
    translateOperation,
    metadata?.messageI18n ?? (operation.message ? { key: operation.message, params: undefined } : undefined),
    operation.message,
  );

  const phaseLabel = resolveOperationText(
    translateOperation,
    metadata?.phaseI18n,
    metadata?.phaseLabel,
  );

  const typeLabel = t(`types.${operationTypeToKey(operation.type)}` as never);
  const statusLabel = t(`status.${operation.status}` as never);

  const variant =
    operation.status === "SUCCESS"
      ? "matched"
      : operation.status === "FAILED"
        ? "destructive"
        : operation.status === "RUNNING"
          ? "draft"
          : "secondary";

  const borderClass =
    operation.status === "SUCCESS"
      ? "border-green-500/40 bg-green-500/5"
      : operation.status === "FAILED"
        ? "border-destructive/40 bg-destructive/5"
        : "border-amber-500/30 bg-muted/40";

  const progressPercent =
    metadata?.current && metadata?.total
      ? Math.min(100, Math.round((metadata.current / metadata.total) * 100))
      : null;

  function handleDismiss() {
    if (!operation) return;
    dismissOperation(operation.id);
    setOperation(null);
  }

  return (
    <div className={`mb-4 rounded-md border p-3 ${borderClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={variant}>{statusLabel}</Badge>
            <span className="text-sm font-medium">{typeLabel}</span>
            {phaseLabel && operation.status === "RUNNING" && (
              <span className="text-xs text-muted-foreground">— {phaseLabel}</span>
            )}
          </div>

          {operation.status === "SUCCESS" && (
            <p className="text-sm font-medium text-green-700 dark:text-green-400">
              {t("banner.success")}
            </p>
          )}

          {operationMessage && (
            <p className="text-sm text-muted-foreground">{operationMessage}</p>
          )}

          {summaryText && (
            <p className="text-xs text-muted-foreground">{summaryText}</p>
          )}

          {progressPercent !== null && operation.status === "RUNNING" && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  {metadata?.current} / {metadata?.total}
                </span>
                <span>{progressPercent}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {(errors.length > 0 || failedSteps.length > 0) && operation.status === "FAILED" && (
            <div className="space-y-1 rounded-md border border-destructive/30 bg-background/80 p-2">
              <p className="text-xs font-medium text-destructive">{t("banner.errors")}</p>
              <ul className="space-y-1 text-xs text-destructive">
                {errors.map((error, index) => (
                  <li key={`error-${index}`}>{error}</li>
                ))}
                {failedSteps
                  .filter((step) => step.error && !errors.includes(step.error))
                  .map((step) => (
                    <li key={step.id}>
                      {resolveStepLabel(translateOperation, step)}: {step.error}
                    </li>
                  ))}
              </ul>
            </div>
          )}

          {steps.length > 0 && (
            <div>
              <button
                type="button"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setExpanded((value) => !value)}
              >
                {expanded ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
                {t("banner.details", { count: steps.length })}
              </button>

              {expanded && (
                <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs">
                  {steps.map((step) => (
                    <li key={step.id} className="flex items-start gap-2">
                      <StepIcon status={step.status} />
                      <span className="min-w-0 break-all">
                        {resolveStepLabel(translateOperation, step)}
                        {step.error && (
                          <span className="block text-destructive">{step.error}</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {(operation.status === "SUCCESS" || operation.status === "FAILED") && (
          <Button variant="ghost" size="sm" className="shrink-0" onClick={handleDismiss}>
            {t("banner.dismiss")}
          </Button>
        )}
      </div>
    </div>
  );
}
