"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { notifyOperationEnded, notifyOperationStarted } from "@/lib/operations/events";
import { useActionFailureState } from "@/lib/i18n/use-action-failure-state";
import { confirmApplyAction } from "@/server/actions/apply";
import { syncRemoteRulesAction } from "@/server/actions/servers";

type ApplyPreviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string | null;
  serverId: string;
  summary: { addCount: number; removeCount: number; updateCount: number; dbSync?: boolean } | null;
  onCompleted: () => Promise<void>;
};

export function ApplyPreviewDialog({
  open,
  onOpenChange,
  sessionId,
  serverId,
  summary,
  onCompleted,
}: ApplyPreviewDialogProps) {
  const t = useTranslations("rules.applyDialog");
  const tc = useTranslations("common");
  const [loading, setLoading] = useState(false);
  const [resyncLoading, setResyncLoading] = useState(false);
  const { message: error, showFailure, setMessage: setError, clearMessage } = useActionFailureState();
  const [needsResync, setNeedsResync] = useState(false);

  async function handleConfirm() {
    if (!sessionId || loading) return;
    setLoading(true);
    clearMessage();
    setNeedsResync(false);
    onOpenChange(false);
    notifyOperationStarted(serverId);

    try {
      const result = await confirmApplyAction(sessionId);
      if (!result.success) {
        if (result.needsRePreview) {
          setError(t("remoteChanged"));
        } else {
          setError(result.error ?? t("failed"));
        }
        setNeedsResync(Boolean(result.needsResync));
        onOpenChange(true);
        return;
      }

      await onCompleted();
    } finally {
      notifyOperationEnded(serverId);
      setLoading(false);
    }
  }

  async function handleForceResync() {
    if (resyncLoading) return;
    setResyncLoading(true);
    clearMessage();
    notifyOperationStarted(serverId);

    try {
      const result = await syncRemoteRulesAction(serverId);
      if (!result.success) {
        showFailure(result, tc);
        return;
      }

      setNeedsResync(false);
      onOpenChange(false);
      await onCompleted();
    } finally {
      notifyOperationEnded(serverId);
      setResyncLoading(false);
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!loading && !resyncLoading) {
          onOpenChange(nextOpen);
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("title")}</AlertDialogTitle>
          <AlertDialogDescription>{t("description")}</AlertDialogDescription>
        </AlertDialogHeader>
        {summary && (
          <div className="space-y-1 text-sm">
            <p>{t("add", { count: summary.addCount })}</p>
            <p>{t("remove", { count: summary.removeCount })}</p>
            <p>{t("reorder", { count: summary.updateCount })}</p>
            {summary.dbSync ? <p>{t("dbSync")}</p> : null}
          </div>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
        {needsResync && (
          <div className="space-y-3">
            <p className="text-sm text-amber-700 dark:text-amber-400">{t("partialResync")}</p>
            <Button
              type="button"
              variant="outline"
              onClick={handleForceResync}
              disabled={resyncLoading || loading}
            >
              {resyncLoading ? t("forceResyncing") : t("forceResync")}
            </Button>
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading || resyncLoading}>{tc("cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading || resyncLoading || !sessionId}
          >
            {loading ? t("applying") : t("apply")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
