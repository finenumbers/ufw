"use client";

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
import type { DockerContainerAction } from "@/types/docker-monitor";

type DockerContainerActionsProps = {
  containerRef: string;
  containerName: string;
  isRunning: boolean;
  loading: boolean;
  pendingAction: DockerContainerAction | null;
  confirmAction: DockerContainerAction | null;
  onStart: () => void;
  onStop: () => void;
  onRestart: () => void;
  onConfirm: () => void;
  onCancelConfirm: () => void;
};

export function DockerContainerActions({
  containerRef,
  containerName,
  isRunning,
  loading,
  pendingAction,
  confirmAction,
  onStart,
  onStop,
  onRestart,
  onConfirm,
  onCancelConfirm,
}: DockerContainerActionsProps) {
  const t = useTranslations("dockerMonitor");

  return (
    <>
      <div className="flex flex-wrap gap-1">
        {!isRunning ? (
          <Button
            size="sm"
            variant="outline"
            disabled={loading}
            onClick={onStart}
          >
            {pendingAction === "START" ? t("acting") : t("actions.start")}
          </Button>
        ) : null}
        {isRunning ? (
          <Button
            size="sm"
            variant="outline"
            disabled={loading}
            onClick={onStop}
          >
            {t("actions.stop")}
          </Button>
        ) : null}
        <Button
          size="sm"
          variant="outline"
          disabled={loading}
          onClick={onRestart}
        >
          {t("actions.restart")}
        </Button>
      </div>

      <AlertDialog open={confirmAction !== null} onOpenChange={(open) => !open && onCancelConfirm()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === "STOP" ? t("confirmStopTitle") : t("confirmRestartTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === "STOP"
                ? t("confirmStopDescription", { name: containerName, id: containerRef })
                : t("confirmRestartDescription", { name: containerName, id: containerRef })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={onCancelConfirm}>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirm}>
              {confirmAction === "STOP" ? t("actions.stop") : t("actions.restart")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
