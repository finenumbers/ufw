"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { notifyOperationStarted } from "@/lib/operations/events";
import {
  enableUfwAction,
  installUfwAction,
  loadUfwStateAction,
  testServerConnectionAction,
} from "@/server/actions/servers";
import type { UfwDetectionResult } from "@/types/ufw";

type UfwDashboardProps = {
  serverId: string;
  initialState: UfwDetectionResult;
};

export function UfwDashboard({ serverId, initialState }: UfwDashboardProps) {
  const router = useRouter();
  const t = useTranslations("ufw");
  const tc = useTranslations("common");
  const [state, setState] = useState(initialState);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setState(initialState);
  }, [initialState]);

  async function refresh() {
    setLoading(true);
    notifyOperationStarted(serverId);
    const next = await loadUfwStateAction(serverId);
    setState(next);
    router.refresh();
    setLoading(false);
  }

  async function handleTestSsh() {
    setLoading(true);
    notifyOperationStarted(serverId);
    await testServerConnectionAction(serverId);
    setLoading(false);
  }

  async function handleInstall() {
    setLoading(true);
    notifyOperationStarted(serverId);
    const result = await installUfwAction(serverId);
    if (result.success) {
      router.refresh();
    }
    setLoading(false);
  }

  async function handleEnable() {
    setLoading(true);
    notifyOperationStarted(serverId);
    const result = await enableUfwAction(serverId);
    if (result.success) {
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <div className="space-y-4 rounded-md border p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={state.installed ? "matched" : "destructive"}>
          {state.installed ? t("installed") : t("notInstalled")}
        </Badge>
        <Badge variant={state.active ? "matched" : "remote"}>
          {state.active ? t("active") : t("inactive")}
        </Badge>
        <Badge variant="secondary">{t("remoteRules", { count: state.rules.length })}</Badge>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={handleTestSsh} disabled={loading}>
          {t("testSsh")}
        </Button>
        <Button variant="outline" onClick={refresh} disabled={loading}>
          {t("refreshStatus")}
        </Button>
        {!state.installed && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={loading}>{t("installUfw")}</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("installTitle")}</AlertDialogTitle>
                <AlertDialogDescription>{t("installDescription")}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{tc("cancel")}</AlertDialogCancel>
                <AlertDialogAction onClick={handleInstall}>{t("confirmInstall")}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        {state.installed && !state.active && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={loading}>{t("activateUfw")}</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("activateTitle")}</AlertDialogTitle>
                <AlertDialogDescription>{t("activateDescription")}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{tc("cancel")}</AlertDialogCancel>
                <AlertDialogAction onClick={handleEnable}>{t("confirmActivate")}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
}
