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
import { deleteIdentityAction } from "@/server/actions/identities";

type IdentityDeleteDialogProps = {
  identityId: string;
  identityName: string;
  serverCount: number;
  linkedServers: Array<{ id: string; name: string; host: string; port: number }>;
};

export function IdentityDeleteDialog({
  identityId,
  identityName,
  serverCount,
  linkedServers,
}: IdentityDeleteDialogProps) {
  const router = useRouter();
  const t = useTranslations("identities.delete");
  const tc = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const blocked = serverCount > 0;

  async function handleDelete() {
    if (blocked) return;

    setLoading(true);
    setError(null);

    const result = await deleteIdentityAction(identityId);
    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setOpen(false);
    router.push("/identities");
    router.refresh();
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button type="button" variant="destructive" disabled={blocked}>
          {t("button")}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{blocked ? t("blockedTitle") : t("title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {blocked
              ? t("blockedDescription", { count: serverCount })
              : t("description", { name: identityName })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {blocked && linkedServers.length > 0 ? (
          <ul className="max-h-40 list-disc overflow-y-auto pl-5 text-sm text-muted-foreground">
            {linkedServers.map((server) => (
              <li key={server.id}>
                {server.name} ({server.port === 22 ? server.host : `${server.host}:${server.port}`})
              </li>
            ))}
          </ul>
        ) : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>{tc("cancel")}</AlertDialogCancel>
          {!blocked ? (
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
          ) : null}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
