import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { ServerDetailView } from "@/components/servers/server-detail-view";
import { isPortScanEnabled } from "@/lib/port-scan/config";
import { isDockerMonitorEnabled } from "@/lib/docker/config";
import { getServerPath } from "@/lib/server-path";
import { getServerByAddressAction } from "@/server/actions/servers";
import { getRulesViewPageAction } from "@/server/actions/rules";
import { getLatestDockerInventory } from "@/server/services/docker-monitor.service";
import { getLatestSuccessfulPortScan } from "@/server/services/port-scan.service";
import {
  detectionFromSnapshot,
  getLatestSnapshot,
  persistSnapshotInterfaceOptions,
} from "@/server/services/snapshot.service";
import type { UfwDetectionResult } from "@/types/ufw";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

const emptyUfwState: UfwDetectionResult = {
  installed: false,
  active: false,
  status: { installed: false, active: false, rawStatus: "" },
  rules: [],
  interfaces: [],
};

type PageProps = {
  params: Promise<{ serverAddress: string }>;
};

export default async function ServerDetailPage({ params }: PageProps) {
  const t = await getTranslations("servers");
  const { serverAddress } = await params;
  const server = await getServerByAddressAction(serverAddress);

  if (!server) {
    notFound();
  }

  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;

  const latestSnapshot = await getLatestSnapshot(server.id);
  const ufwState = latestSnapshot ? detectionFromSnapshot(latestSnapshot) : emptyUfwState;

  const needsSync = Boolean(userId) && ufwState.installed && ufwState.active && !latestSnapshot;

  if (
    ufwState.installed &&
    ufwState.active &&
    latestSnapshot &&
    ufwState.interfaces.length > 0 &&
    !needsSync
  ) {
    await persistSnapshotInterfaceOptions(server.id, ufwState.interfaces, latestSnapshot);
  }

  const portScanEnabled = isPortScanEnabled();
  const dockerMonitorEnabled = isDockerMonitorEnabled();

  const [rulesPage, initialPortScan, initialDockerInventory] = await Promise.all([
    userId
      ? getRulesViewPageAction(server.id, 0)
      : Promise.resolve({ rows: [], total: 0, hasMore: false, nextOffset: 0 }),
    portScanEnabled ? getLatestSuccessfulPortScan(server.id) : Promise.resolve(null),
    dockerMonitorEnabled ? getLatestDockerInventory(server.id) : Promise.resolve(null),
  ]);

  const rulesAvailable = ufwState.installed && ufwState.active;
  const dbRulesCount = rulesPage.total;
  const portFindingCount =
    initialPortScan?.summary?.openCount ?? initialPortScan?.findings.length ?? 0;
  const containerCount =
    initialDockerInventory?.summary?.containerCount ?? 0;

  return (
    <ServerDetailView
      server={{
        id: server.id,
        name: server.name,
        host: server.host,
        port: server.port,
        username: server.identity.username,
      }}
      editHref={getServerPath(server.host, "/edit")}
      ufwState={ufwState}
      needsSync={needsSync}
      dbRulesCount={dbRulesCount}
      portFindingCount={portFindingCount}
      containerCount={containerCount}
      initialPortScan={initialPortScan}
      initialDockerInventory={initialDockerInventory}
      initialRows={rulesPage.rows}
      initialTotal={rulesPage.total}
      initialHasMore={rulesPage.hasMore}
      initialNextOffset={rulesPage.nextOffset}
      rulesAvailable={rulesAvailable}
      rulesUnavailableMessage={t("rulesUnavailable")}
      portScanEnabled={portScanEnabled}
      dockerMonitorEnabled={dockerMonitorEnabled}
    />
  );
}
