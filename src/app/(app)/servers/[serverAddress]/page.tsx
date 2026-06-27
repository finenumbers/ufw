import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { ServerDetailView } from "@/components/servers/server-detail-view";
import { isPortScanEnabled } from "@/lib/port-scan/config";
import { isDockerMonitorEnabled } from "@/lib/docker/config";
import { getServerPath } from "@/lib/server-path";
import { getServerByAddressAction } from "@/server/actions/servers";
import { getRulesViewPageAction } from "@/server/actions/rules";
import { getRuleRecordCount } from "@/server/services/server.service";
import { detectUfwState } from "@/server/services/ssh.service";
import { getLatestSnapshot, persistSnapshotInterfaceOptions } from "@/server/services/snapshot.service";
import { remoteSnapshotOutOfSync } from "@/server/services/rules-view.service";
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

  let ufwState = emptyUfwState;
  try {
    ufwState = await detectUfwState(server.id);
  } catch {
    ufwState = emptyUfwState;
  }

  const latestSnapshot =
    ufwState.installed && ufwState.active ? await getLatestSnapshot(server.id) : null;

  const needsSync =
    Boolean(userId) &&
    ufwState.installed &&
    ufwState.active &&
    remoteSnapshotOutOfSync(latestSnapshot, ufwState.rules);

  if (
    ufwState.installed &&
    ufwState.active &&
    latestSnapshot &&
    ufwState.interfaces.length > 0 &&
    !needsSync
  ) {
    await persistSnapshotInterfaceOptions(server.id, ufwState.interfaces);
  }

  const rulesPage = userId
    ? await getRulesViewPageAction(server.id, 0)
    : { rows: [], total: 0, hasMore: false, nextOffset: 0 };
  const dbRulesCount = await getRuleRecordCount(server.id);
  const rulesAvailable = ufwState.installed && ufwState.active;
  const portScanEnabled = isPortScanEnabled();
  const dockerMonitorEnabled = isDockerMonitorEnabled();

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
