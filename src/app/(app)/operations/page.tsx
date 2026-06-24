import { OperationsPageView } from "@/components/operations/operations-page-view";
import { TABLE_PAGE_SIZE } from "@/lib/pagination/table-page-size";
import { listAuditEvents } from "@/server/services/audit.service";
import { listOperationLogs } from "@/server/services/operation-log.service";

export const dynamic = "force-dynamic";

export default async function OperationsPage() {
  const [operations, audits] = await Promise.all([
    listOperationLogs({ page: 1, pageSize: TABLE_PAGE_SIZE }),
    listAuditEvents({ page: 1, pageSize: TABLE_PAGE_SIZE }),
  ]);

  return (
    <OperationsPageView
      initialLogs={operations.items}
      initialLogsTotal={operations.total}
      initialAudits={audits.items}
      initialAuditsTotal={audits.total}
    />
  );
}
