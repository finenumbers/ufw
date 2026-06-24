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
import { notifyOperationStarted } from "@/lib/operations/events";
import { confirmApplyAction } from "@/server/actions/apply";
import { forceResyncFromRemoteAction } from "@/server/actions/servers";

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
  const [error, setError] = useState<string | null>(null);
  const [needsResync, setNeedsResync] = useState(false);

  async function handleConfirm() {
    if (!sessionId || loading) return;
    setLoading(true);
    setError(null);
    setNeedsResync(false);
    onOpenChange(false);
    notifyOperationStarted(serverId);

    const result = await confirmApplyAction(sessionId);
    setLoading(false);

    if (!result.success) {
      setError(result.error ?? t("failed"));
      setNeedsResync(Boolean(result.needsResync));
      onOpenChange(true);
      return;
    }

    await onCompleted();
  }

  async function handleForceResync() {
    if (resyncLoading) return;
    setResyncLoading(true);
    setError(null);
    notifyOperationStarted(serverId);

    const result = await forceResyncFromRemoteAction(serverId);
    setResyncLoading(false);

    if (!result.success) {
      setError(result.error ?? t("forceResyncFailed"));
      return;
    }

    setNeedsResync(false);
    onOpenChange(false);
    await onCompleted();
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
