"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { OperationsClearHistoryButton } from "@/components/operations/operations-clear-history-button";
import { OperationsHistory } from "@/components/operations/operations-history";

type OperationsPageViewProps = {
  initialLogs: Parameters<typeof OperationsHistory>[0]["initialLogs"];
  initialLogsTotal: number;
  initialAudits: Parameters<typeof OperationsHistory>[0]["initialAudits"];
  initialAuditsTotal: number;
};

export function OperationsPageView({
  initialLogs,
  initialLogsTotal,
  initialAudits,
  initialAuditsTotal,
}: OperationsPageViewProps) {
  const t = useTranslations("operationsPage");
  const router = useRouter();
  const [snapshot, setSnapshot] = useState({
    logs: initialLogs,
    logsTotal: initialLogsTotal,
    audits: initialAudits,
    auditsTotal: initialAuditsTotal,
  });

  useEffect(() => {
    setSnapshot({
      logs: initialLogs,
      logsTotal: initialLogsTotal,
      audits: initialAudits,
      auditsTotal: initialAuditsTotal,
    });
  }, [initialLogs, initialLogsTotal, initialAudits, initialAuditsTotal]);

  function handleCleared() {
    setSnapshot({
      logs: [],
      logsTotal: 0,
      audits: [],
      auditsTotal: 0,
    });
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">{t("title")}</h2>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <OperationsClearHistoryButton onCleared={handleCleared} />
      </div>

      <OperationsHistory
        initialLogs={snapshot.logs}
        initialLogsTotal={snapshot.logsTotal}
        initialAudits={snapshot.audits}
        initialAuditsTotal={snapshot.auditsTotal}
      />
    </div>
  );
}
