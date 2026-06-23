import { getTranslations } from "next-intl/server";

import { resolveOperationText } from "@/lib/i18n/operations";
import { listAuditEvents } from "@/server/services/audit.service";
import { listOperationLogs } from "@/server/services/operation-log.service";
import { Badge } from "@/components/ui/badge";
import { operationTypeToKey, parseOperationMetadata } from "@/types/operation";

export const dynamic = "force-dynamic";

export default async function OperationsPage() {
  const t = await getTranslations("operationsPage");
  const to = await getTranslations("operations");
  const tc = await getTranslations("common");

  const translateOperation = (key: string, values?: Record<string, string | number>) =>
    to(key as never, values as never);

  const [operations, audits] = await Promise.all([
    listOperationLogs({ pageSize: 50 }),
    listAuditEvents({ pageSize: 50 }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold">{t("title")}</h2>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>

      <section className="space-y-3">
        <h3 className="text-lg font-medium">{t("logsTitle")}</h3>
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-left">{t("time")}</th>
                <th className="px-3 py-2 text-left">{t("type")}</th>
                <th className="px-3 py-2 text-left">{t("status")}</th>
                <th className="px-3 py-2 text-left">{t("message")}</th>
              </tr>
            </thead>
            <tbody>
              {operations.items.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="px-3 py-2">{item.createdAt.toLocaleString()}</td>
                  <td className="px-3 py-2">
                    {to(`types.${operationTypeToKey(item.type)}` as never)}
                  </td>
                  <td className="px-3 py-2">
                    <Badge
                      variant={
                        item.status === "SUCCESS"
                          ? "matched"
                          : item.status === "FAILED"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {to(`status.${item.status}` as never)}
                    </Badge>
                  </td>
                  <td className="px-3 py-2">
                    {resolveOperationText(
                      translateOperation,
                      parseOperationMetadata(item.metadata)?.messageI18n ??
                        (item.message ? { key: item.message } : undefined),
                      item.message,
                    ) ?? tc("dash")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-medium">{t("auditTitle")}</h3>
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-left">{t("time")}</th>
                <th className="px-3 py-2 text-left">{t("action")}</th>
                <th className="px-3 py-2 text-left">{t("user")}</th>
                <th className="px-3 py-2 text-left">{t("entity")}</th>
              </tr>
            </thead>
            <tbody>
              {audits.items.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="px-3 py-2">{item.createdAt.toLocaleString()}</td>
                  <td className="px-3 py-2">{item.action}</td>
                  <td className="px-3 py-2">{item.user?.email ?? tc("dash")}</td>
                  <td className="px-3 py-2">
                    {item.entityType ?? tc("dash")} {item.entityId ? `(${item.entityId})` : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
