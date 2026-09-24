"use client";

import Link from "next/link";
import { Settings } from "lucide-react";
import { useTranslations } from "next-intl";

import { useServerReachability } from "@/components/layout/reachability-provider";
import { ServerBlockBadge } from "@/components/layout/server-block-badge";
import { ServerReachabilityBadge } from "@/components/layout/server-reachability-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getServerPath } from "@/lib/server-path";
import { cn } from "@/lib/utils";

type ServerCardData = {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  savedRuleCount: number;
  portFindingCount: number;
};

function ServerCard({ server }: { server: ServerCardData }) {
  const t = useTranslations("servers");
  const tUfw = useTranslations("ufw");
  const tPortScan = useTranslations("portScan");
  const tc = useTranslations("common");
  const unreachable = useServerReachability(server.id)?.status === "unreachable";

  return (
    <Card className={cn("relative", unreachable && "border-red-300 bg-red-100")}>
      <div className="absolute right-3 top-3 z-10 flex flex-col items-end gap-1">
        <ServerReachabilityBadge serverId={server.id} />
        <ServerBlockBadge serverId={server.id} host={server.host} />
      </div>
      <CardHeader className="pr-40">
        <CardTitle>{server.name}</CardTitle>
        <CardDescription>
          {server.username}@{server.host}:{server.port}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1 text-sm font-semibold">
          <span className={cn(server.savedRuleCount > 0 ? "text-green-700" : "text-red-600")}>
            {tUfw("savedRules", { count: server.savedRuleCount })}
          </span>
          <span className={cn(server.portFindingCount > 0 ? "text-green-700" : "text-red-600")}>
            {tPortScan("portCount", { count: server.portFindingCount })}
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
  );
}

export function ServersGrid({ servers }: { servers: ServerCardData[] }) {
  if (servers.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {servers.map((server) => (
        <ServerCard key={server.id} server={server} />
      ))}
    </div>
  );
}
