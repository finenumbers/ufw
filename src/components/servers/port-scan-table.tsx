"use client";

import { useTranslations } from "next-intl";

import type { PortScanFindingView, PortScanSummary } from "@/types/port-scan";

type PortScanTableProps = {
  findings: PortScanFindingView[];
  summary: PortScanSummary | null;
};

function coverageClass(coverage: PortScanFindingView["ufwCoverage"]): string {
  switch (coverage) {
    case "NOT_IN_UFW":
      return "bg-red-50";
    case "ALLOWED":
      return "bg-green-50";
    case "DENIED":
      return "bg-amber-50";
    default:
      return "";
  }
}

export function PortScanTable({ findings, summary }: PortScanTableProps) {
  const t = useTranslations("portScan");

  if (findings.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
        {t("empty")}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {summary ? (
        <p className="text-sm text-muted-foreground">
          {t("summary", {
            open: summary.openCount,
            enriched: summary.enrichedCount,
            notInUfw: summary.notInUfwCount,
          })}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/40 text-left">
            <tr>
              <th className="px-3 py-2 font-medium">{t("columns.port")}</th>
              <th className="px-3 py-2 font-medium">{t("columns.protocol")}</th>
              <th className="px-3 py-2 font-medium">{t("columns.state")}</th>
              <th className="px-3 py-2 font-medium">{t("columns.service")}</th>
              <th className="px-3 py-2 font-medium">{t("columns.product")}</th>
              <th className="px-3 py-2 font-medium">{t("columns.ufw")}</th>
            </tr>
          </thead>
          <tbody>
            {findings.map((row) => (
              <tr key={row.id} className={coverageClass(row.ufwCoverage)}>
                <td className="px-3 py-2 font-mono">{row.port}</td>
                <td className="px-3 py-2 uppercase">{row.protocol}</td>
                <td className="px-3 py-2">{row.state}</td>
                <td className="px-3 py-2">{row.serviceName ?? "—"}</td>
                <td className="px-3 py-2">{row.displayLabel ?? "—"}</td>
                <td className="px-3 py-2">
                  {row.ufwCoverage ? t(`coverage.${row.ufwCoverage}`) : t("coverage.UNKNOWN")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
