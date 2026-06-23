"use client";

import { useRouter } from "next/navigation";
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
import { deleteServerAction } from "@/server/actions/servers";

type ServerDeleteDialogProps = {
  serverId: string;
  serverName: string;
  redirectTo?: string;
  trigger?: React.ReactNode;
};

export function ServerDeleteDialog({
  serverId,
  serverName,
  redirectTo = "/servers",
  trigger,
}: ServerDeleteDialogProps) {
  const router = useRouter();
  const t = useTranslations("servers.delete");
  const tc = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setLoading(true);
    setError(null);

    const result = await deleteServerAction(serverId);
    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setOpen(false);
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {trigger ?? (
          <Button type="button" variant="destructive">
            {t("button")}
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("description", { name: serverName })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>{tc("cancel")}</AlertDialogCancel>
          <AlertDialogAction
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={(event) => {
              event.preventDefault();
              void handleDelete();
            }}
          >
            {loading ? t("deleting") : t("confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
