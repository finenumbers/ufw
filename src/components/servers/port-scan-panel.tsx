"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { notifyOperationStarted } from "@/lib/operations/events";
import type { PortScanView } from "@/types/port-scan";
import {
  getLatestPortScanAction,
  startPortScanAction,
} from "@/server/actions/port-scan";

import { PortScanTable } from "@/components/servers/port-scan-table";

type PortScanPanelProps = {
  serverId: string;
  initialScan: PortScanView | null;
  enabled: boolean;
};

export function PortScanPanel({ serverId, initialScan, enabled }: PortScanPanelProps) {
  const t = useTranslations("portScan");
  const [scan, setScan] = useState<PortScanView | null>(initialScan);
  const [profile, setProfile] = useState<"TOP1000" | "FULL">("TOP1000");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const latest = await getLatestPortScanAction(serverId);
    setScan(latest);
  }, [serverId]);

  useEffect(() => {
    function handleOperationStarted(event: Event) {
      const detail = (event as CustomEvent<{ serverId?: string }>).detail;
      if (detail?.serverId === serverId) {
        void refresh();
      }
    }

    window.addEventListener("operation-started", handleOperationStarted);
    return () => window.removeEventListener("operation-started", handleOperationStarted);
  }, [refresh, serverId]);

  useEffect(() => {
    if (!scan || (scan.status !== "RUNNING" && scan.status !== "PENDING")) {
      return;
    }

    const timer = window.setInterval(() => {
      void refresh();
    }, 3000);

    return () => window.clearInterval(timer);
  }, [refresh, scan]);

  async function handleScan() {
    setLoading(true);
    setError(null);

    const result = await startPortScanAction(serverId, profile);
    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    notifyOperationStarted(serverId);
    await refresh();
  }

  if (!enabled) {
    return (
      <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
        {t("disabled")}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">{t("title")}</h3>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={profile} onValueChange={(value) => setProfile(value as "TOP1000" | "FULL")}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TOP1000">{t("profileTop1000")}</SelectItem>
              <SelectItem value="FULL">{t("profileFull")}</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => void handleScan()} disabled={loading}>
            {loading ? t("scanning") : t("scanButton")}
          </Button>
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {scan?.completedAt ? (
        <p className="text-xs text-muted-foreground">
          {t("lastScanAt", {
            date: new Date(scan.completedAt).toLocaleString(),
            target: scan.targetHost,
          })}
        </p>
      ) : null}

      {scan?.errorMessage && scan.status === "FAILED" ? (
        <p className="text-sm text-destructive">{scan.errorMessage}</p>
      ) : null}

      <PortScanTable findings={scan?.findings ?? []} summary={scan?.summary ?? null} />
    </div>
  );
}
