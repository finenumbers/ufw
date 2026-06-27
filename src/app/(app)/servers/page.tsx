import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Settings } from "lucide-react";

import { ServersConfigToolbar } from "@/components/servers/servers-config-toolbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getServerPath } from "@/lib/server-path";
import { cn } from "@/lib/utils";
import { getServersAction } from "@/server/actions/servers";

export default async function ServersPage() {
  const t = await getTranslations("servers");
  const tUfw = await getTranslations("ufw");
  const tPortScan = await getTranslations("portScan");
  const tDocker = await getTranslations("dockerMonitor");
  const tc = await getTranslations("common");
  const servers = await getServersAction();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">{t("title")}</h2>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <ServersConfigToolbar />
      </div>

      {servers.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {servers.map((server) => (
            <Card key={server.id}>
              <CardHeader>
                <CardTitle>{server.name}</CardTitle>
                <CardDescription>
                  {server.identity.username}@{server.host}:{server.port}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-1 text-sm font-semibold">
                  <span
                    className={cn(
                      server.ruleRecordCount > 0 ? "text-green-700" : "text-red-600",
                    )}
                  >
                    {tUfw("dbRules", { count: server.ruleRecordCount })}
                  </span>
                  <span
                    className={cn(
                      server.portFindingCount > 0 ? "text-green-700" : "text-red-600",
                    )}
                  >
                    {tPortScan("portCount", { count: server.portFindingCount })}
                  </span>
                  <span
                    className={cn(
                      server.containerCount > 0 ? "text-green-700" : "text-red-600",
                    )}
                  >
                    {tDocker("containerCount", { count: server.containerCount })}
                  </span>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button asChild variant="outline">
                    <Link href={getServerPath(server.host)}>{tc("open")}</Link>
                  </Button>
                  <Button asChild variant="outline" size="icon" aria-label={t("editServer")}>
                    <Link href={getServerPath(server.host, "/edit")}>
                      <Settings className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}
