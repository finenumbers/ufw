"use client";

import { useTranslations } from "next-intl";

import { useServerReachability } from "@/components/layout/reachability-provider";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function ServerReachabilityBadge({
  serverId,
  className,
}: {
  serverId: string;
  className?: string;
}) {
  const t = useTranslations("servers.reachability");
  const reachability = useServerReachability(serverId);

  if (!reachability || reachability.status === "unknown") {
    return null;
  }

  if (reachability.status === "reachable" && reachability.rttMs != null) {
    return (
      <Badge variant="reachable" className={cn("shrink-0", className)}>
        {t("latency", { ms: reachability.rttMs })}
      </Badge>
    );
  }

  if (reachability.status === "reachable") {
    return (
      <Badge variant="reachable" className={cn("shrink-0", className)}>
        {t("online")}
      </Badge>
    );
  }

  if (reachability.status === "unreachable") {
    return (
      <Badge variant="unreachable" className={cn("shrink-0", className)}>
        {t("unreachable")}
      </Badge>
    );
  }

  return null;
}
