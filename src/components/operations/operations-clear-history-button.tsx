"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { clearOperationsHistoryAction } from "@/server/actions/operations";

type OperationsClearHistoryButtonProps = {
  onCleared?: () => void;
};

export function OperationsClearHistoryButton({
  onCleared,
}: OperationsClearHistoryButtonProps) {
  const t = useTranslations("operationsPage");
  const tc = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClear() {
    setLoading(true);
    setError(null);

    const result = await clearOperationsHistoryAction();
    setLoading(false);

    if (!result.success) {
      setError(
        result.error === "RUNNING_OPERATION" ? t("clearHistoryBlocked") : result.error,
      );
      return;
    }

    setOpen(false);
    onCleared?.();
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button type="button">{t("clearHistory")}</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("clearHistoryTitle")}</AlertDialogTitle>
          <AlertDialogDescription>{t("clearHistoryDescription")}</AlertDialogDescription>
        </AlertDialogHeader>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>{tc("cancel")}</AlertDialogCancel>
          <AlertDialogAction
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={(event) => {
              event.preventDefault();
              void handleClear();
            }}
          >
            {loading ? t("clearHistoryClearing") : t("clearHistoryConfirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
